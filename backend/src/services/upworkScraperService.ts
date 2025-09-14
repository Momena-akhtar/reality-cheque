import { connect, type PageWithCursor } from "puppeteer-real-browser";
import type { Browser } from "rebrowser-puppeteer-core";
import * as cheerio from "cheerio";

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

class EnhancedUpworkScraper {
  private readonly DEFAULT_TIMEOUT = 60000;
  private readonly WAIT_DELAY = 5000;

  async scrapeUpworkProfile(profileUrl: string): Promise<UpworkProfileData> {
    let browser: any;
    let page: PageWithCursor | undefined;

    try {
      if (!this.isValidUpworkUrl(profileUrl)) {
        return this.createErrorResponse('Invalid Upwork profile URL');
      }

      // Initialize browser with Cloudflare bypass
      const connection = await this.initializeBrowser();
      browser = connection.browser;
      page = connection.page;

      // Navigate to profile
      console.log(`Navigating to ${profileUrl}`);
      await page.goto(profileUrl, { waitUntil: "networkidle2" });

      // Check for Cloudflare block and handle it
      if (await this.isCloudflareBlocked(page)) {
        console.log("Cloudflare challenge detected, waiting for resolution...");
        await this.handleCloudflareChallenge(page, browser, profileUrl);
        
        // Wait a bit more after Cloudflare resolution
        await this.delay(3000);
      }

      // Wait for page to stabilize
      await this.delay(this.WAIT_DELAY);

      // Get page content and parse
      const htmlContent = await page.content();
      const $ = cheerio.load(htmlContent);

      // Debug: Log page title and some basic info
      const pageTitle = await page.title();
      console.log(`Page title: ${pageTitle}`);
      console.log(`Page content length: ${htmlContent.length}`);

      // Validate we have profile content
      if (this.isEmptyOrBlocked($)) {
        console.log('Profile appears to be blocked or empty');
        throw new Error('Profile content not accessible or blocked');
      }

      console.log('Profile content detected, extracting data...');
      const profileData = this.extractProfileData($);
      
      await this.closeBrowser(page, browser);
      
      return {
        ...profileData,
        success: true
      };

    } catch (error) {
      console.error('Scraping failed:', error);
      
      await this.closeBrowser(page, browser);
      
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to scrape profile'
      );
    }
  }

  private async initializeBrowser() {
    const connectOptions = {
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      customConfig: {},
      turnstile: true,
      connectOption: {},
      disableXvfb: false,
      ignoreAllFlags: false,
    };

    const connection = await connect(connectOptions);
    connection.page.setDefaultTimeout(this.DEFAULT_TIMEOUT);
    
    return connection;
  }

  private async isCloudflareBlocked(page: PageWithCursor): Promise<boolean> {
    try {
      // Check for Cloudflare challenge page indicators
      const challengeIndicators = [
        'h1',
        '[data-testid="cf-challenge-running"]',
        '.cf-browser-verification',
        '#cf-challenge-running',
        '.cf-wrapper'
      ];
      
      for (const selector of challengeIndicators) {
        try {
          await page.waitForSelector(selector, { timeout: 2000 });
          const element = await page.$(selector);
          if (element) {
            const text = await page.evaluate(el => el.textContent?.trim() || '', element);
            if (text.includes('Please verify you are a human') ||
                text.includes('Checking your browser') ||
                text.includes('Sorry, you have been blocked') ||
                text.includes('Just a moment')) {
              return true;
            }
          }
        } catch {
          // Continue to next selector
        }
      }
      
      // Check for Cloudflare-specific elements in the HTML
      const htmlContent = await page.content();
      const hasCloudflareElements = htmlContent.includes('cf-') || 
                                   htmlContent.includes('cloudflare') ||
                                   htmlContent.includes('challenge-platform') ||
                                   htmlContent.includes('cf-browser-verification');
      
      return hasCloudflareElements;
    } catch {
      return false;
    }
  }

  private async handleCloudflareChallenge(
    page: PageWithCursor, 
    browser: Browser, 
    url: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      let isResolved = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max
      
      // Wait for Cloudflare challenge to be resolved
      const checkInterval = setInterval(async () => {
        try {
          attempts++;
          
          // Check if we're still on a Cloudflare challenge page
          const isStillBlocked = await this.isCloudflareBlocked(page);
          
          if (!isStillBlocked) {
            console.log("Cloudflare challenge resolved!");
            isResolved = true;
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve();
            return;
          }
          
          // Check if we have valid profile content
          const htmlContent = await page.content();
          const $ = cheerio.load(htmlContent);
          
          if (!this.isEmptyOrBlocked($)) {
            console.log("Profile content detected, Cloudflare resolved!");
            isResolved = true;
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve();
            return;
          }
          
          if (attempts >= maxAttempts) {
            console.log("Max attempts reached, assuming Cloudflare resolved");
            isResolved = true;
            clearInterval(checkInterval);
            clearTimeout(timeout);
            resolve();
            return;
          }
          
          console.log(`Waiting for Cloudflare resolution... (${attempts}/${maxAttempts})`);
          
        } catch (e) {
          console.error('Cloudflare check error:', e);
        }
      }, 2000); // Check every 2 seconds

      const timeout = setTimeout(() => {
        if (!isResolved) {
          clearInterval(checkInterval);
          reject(new Error("Cloudflare challenge timeout"));
        }
      }, this.DEFAULT_TIMEOUT);
    });
  }

  private extractProfileData($: cheerio.CheerioAPI): Omit<UpworkProfileData, 'success' | 'error'> {
    return {
      title: this.extractTitle($),
      summary: this.extractSummary($),
      skills: this.extractSkills($),
      portfolio: this.extractPortfolio($),
      hourlyRate: this.extractHourlyRate($),
      availability: this.extractAvailability($),
      location: this.extractLocation($)
    };
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    const selectors = [
      'h2[itemprop="name"]', // From working scraper
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
      '.overview-text',
      '[data-test="OverviewTile"] div[data-test="Description"]'
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
      '.freelancer-skills .skill',
      '[data-test="Skill"]'
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
      '.project-item',
      '[data-test="PortfolioItem"]'
    ];

    containerSelectors.forEach(containerSelector => {
      $(containerSelector).each((_, element) => {
        const $item = $(element);
        
        const title = $item.find([
          '[data-qa="work-title"]',
          '.portfolio-title',
          '.work-title',
          'h3', 'h4'
        ].join(', ')).first().text().trim();
        
        const description = $item.find([
          '[data-qa="work-description"]',
          '.portfolio-description', 
          '.work-description',
          'p'
        ].join(', ')).first().text().trim();
        
        let imageUrl = $item.find('img').attr('src');
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('//') ? 
            `https:${imageUrl}` : 
            `https://www.upwork.com${imageUrl}`;
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
      '.rate-display',
      '[data-test="HourlyRate"]'
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

  private isEmptyOrBlocked($: cheerio.CheerioAPI): boolean {
    const blockingIndicators = [
      'Access Denied',
      'Forbidden',
      'Please verify you are a human',
      'captcha',
      'blocked',
      'security check',
      'sorry, you have been blocked',
      'checking your browser',
      'please wait while we check your browser'
    ];
    
    const pageText = $('body').text().toLowerCase();
    
    // Check for blocking indicators
    const hasBlockingIndicators = blockingIndicators.some(indicator => 
      pageText.includes(indicator.toLowerCase())
    );
    
    // Check for very little content (likely blocked or empty)
    const hasMinimalContent = pageText.length < 200;
    
    // Check for Cloudflare-specific elements
    const bodyHtml = $('body').html() || '';
    const hasCloudflareElements = bodyHtml.includes('cf-') || 
                                 bodyHtml.includes('cloudflare') ||
                                 bodyHtml.includes('challenge-platform');
    
    // Check if we have any Upwork profile-specific elements
    const hasProfileElements = $('[data-qa="freelancer-profile-title"]').length > 0 ||
                              $('h2[itemprop="name"]').length > 0 ||
                              $('[data-qa="overview"]').length > 0 ||
                              $('[data-qa="skill"]').length > 0 ||
                              $('.freelancer-title').length > 0;
    
    // If we have profile elements, we're not blocked
    if (hasProfileElements) {
      return false;
    }
    
    // If we have blocking indicators or minimal content, we're blocked
    return hasBlockingIndicators || hasMinimalContent || hasCloudflareElements;
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

  private async closeBrowser(
    page?: PageWithCursor, 
    browser?: { connected: boolean; close: () => Promise<void> }
  ): Promise<void> {
    try {
      if (page && !page.isClosed()) {
        await page.close();
      }
      if (browser?.connected) {
        await browser.close();
      }
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage example
export default new EnhancedUpworkScraper();

// Example usage:
/*
const scraper = new EnhancedUpworkScraper();
scraper.scrapeUpworkProfile("https://www.upwork.com/freelancers/~0157c5ba50d278cc2a")
  .then(result => {
    if (result.success) {
      console.log('Profile Data:', result);
    } else {
      console.error('Error:', result.error);
    }
  });
*/