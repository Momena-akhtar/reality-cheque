import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';

export interface UpworkProfileData {
  title: string;
  summary: string;
  skills: string[];
  portfolio: Array<{
    title: string;
    description: string;
    imageUrl?: string;
  }>;
  hourlyRate?: string;
  availability?: string;
  location?: string;
  success: boolean;
  error?: string;
}

class UpworkScraperService {
  private readonly USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
  ];

  private getRandomUserAgent(): string {
    return this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeUpworkProfile(profileUrl: string, retries = 3): Promise<UpworkProfileData> {
    // Add random delay to avoid rate limiting
    await this.delay(Math.random() * 2000 + 1000); // 1-3 seconds

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        if (!this.isValidUpworkUrl(profileUrl)) {
          return this.createErrorResponse('Invalid Upwork profile URL');
        }

        const config: AxiosRequestConfig = {
          headers: {
            'User-Agent': this.getRandomUserAgent(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'Connection': 'keep-alive',
            'DNT': '1',
            'Sec-GPC': '1',
            // Add referer to appear more legitimate
            'Referer': 'https://www.upwork.com/'
          },
          timeout: 15000,
          maxRedirects: 5,
          // Handle cookies if needed
          withCredentials: false,
          // Validate status to handle various response codes
          validateStatus: (status) => status < 500
        };

        const response = await axios.get(profileUrl, config);

        if (response.status === 403) {
          if (attempt < retries - 1) {
            // Exponential backoff
            await this.delay(Math.pow(2, attempt) * 2000);
            continue;
          }
          throw new Error('Access forbidden - profile may be private or require authentication');
        }

        if (response.status === 404) {
          return this.createErrorResponse('Profile not found. Please check the URL.');
        }

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const $ = cheerio.load(response.data);
        
        // Check if we got a valid profile page
        if (this.isBlockedOrEmpty($)) {
          if (attempt < retries - 1) {
            await this.delay(Math.pow(2, attempt) * 3000);
            continue;
          }
          return this.createErrorResponse('Unable to access profile content. Profile may be private or require login.');
        }

        return {
          title: this.extractTitle($),
          summary: this.extractSummary($),
          skills: this.extractSkills($),
          portfolio: this.extractPortfolio($),
          hourlyRate: this.extractHourlyRate($),
          availability: this.extractAvailability($),
          location: this.extractLocation($),
          success: true
        };

      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        
        if (attempt === retries - 1) {
          return this.createErrorResponse(
            error instanceof Error ? error.message : 'Failed to scrape profile'
          );
        }
        
        // Wait before retry
        await this.delay(Math.pow(2, attempt) * 2000);
      }
    }

    return this.createErrorResponse('Max retries exceeded');
  }

  private createErrorResponse(error: string): UpworkProfileData {
    return {
      title: '',
      summary: '',
      skills: [],
      portfolio: [],
      success: false,
      error
    };
  }

  private isValidUpworkUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('upwork.com') && 
             (urlObj.pathname.includes('/freelancers/') || 
              urlObj.pathname.includes('/fl/'));
    } catch {
      return false;
    }
  }

  private isBlockedOrEmpty($: cheerio.CheerioAPI): boolean {
    // Check for common blocking indicators
    const blockingIndicators = [
      'Access Denied',
      'Forbidden',
      'Please verify you are a human',
      'captcha',
      'blocked',
      'security check'
    ];
    
    const pageText = $('body').text().toLowerCase();
    return blockingIndicators.some(indicator => 
      pageText.includes(indicator.toLowerCase())
    );
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    const selectors = [
      '[data-qa="freelancer-profile-title"]',
      '[data-test="freelancer-title"]',
      'h1[data-qa="title"]',
      '.freelancer-title',
      'h1.up-card-header-title',
      '.profile-title h1',
      'h1'
    ];

    return this.extractBySelectors($, selectors);
  }

  private extractSummary($: cheerio.CheerioAPI): string {
    const selectors = [
      '[data-qa="overview"]',
      '[data-test="freelancer-overview"]',
      '.freelancer-overview',
      '.up-card-section p',
      '.profile-overview',
      '.overview-text'
    ];

    return this.extractBySelectors($, selectors);
  }

  private extractSkills($: cheerio.CheerioAPI): string[] {
    const skills = new Set<string>();
    
    const selectors = [
      '[data-qa="skill"] span',
      '[data-test="skill-tag"]',
      '.skill-tag',
      '.up-skill-badge',
      '.freelancer-skills .skill'
    ];

    selectors.forEach(selector => {
      $(selector).each((_, element) => {
        const skill = $(element).text().trim();
        if (skill && skill.length > 0 && skill.length < 50) {
          skills.add(skill);
        }
      });
    });

    return Array.from(skills).slice(0, 20);
  }

  private extractPortfolio($: cheerio.CheerioAPI): Array<{title: string; description: string; imageUrl?: string}> {
    const portfolio: Array<{title: string; description: string; imageUrl?: string}> = [];
    
    const containerSelectors = [
      '[data-qa="work-item"]',
      '.portfolio-item',
      '.work-item',
      '.project-item'
    ];

    containerSelectors.forEach(containerSelector => {
      $(containerSelector).each((_, element) => {
        const $item = $(element);
        
        const title = $item.find('[data-qa="work-title"], .portfolio-title, .work-title, h3, h4')
          .first().text().trim();
        
        const description = $item.find('[data-qa="work-description"], .portfolio-description, .work-description, p')
          .first().text().trim();
        
        let imageUrl = $item.find('img').attr('src');
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://www.upwork.com${imageUrl}`;
        }

        if (title || description) {
          portfolio.push({
            title: title || 'Untitled Project',
            description: description || '',
            imageUrl: imageUrl || undefined
          });
        }
      });
    });

    return portfolio.slice(0, 10);
  }

  private extractHourlyRate($: cheerio.CheerioAPI): string {
    const selectors = [
      '[data-qa="hourly-rate"]',
      '[data-test="hourly-rate"]',
      '.hourly-rate',
      '.rate-display'
    ];

    const rate = this.extractBySelectors($, selectors);
    return rate.includes('$') ? rate : '';
  }

  private extractAvailability($: cheerio.CheerioAPI): string {
    const selectors = [
      '[data-qa="availability"]',
      '[data-test="availability"]',
      '.availability-status',
      '.freelancer-status'
    ];

    return this.extractBySelectors($, selectors);
  }

  private extractLocation($: cheerio.CheerioAPI): string {
    const selectors = [
      '[data-qa="location"]',
      '[data-test="location"]',
      '.freelancer-location',
      '.location-text'
    ];

    return this.extractBySelectors($, selectors);
  }

  private extractBySelectors($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 0) {
        return text;
      }
    }
    return '';
  }
}

export default new UpworkScraperService();