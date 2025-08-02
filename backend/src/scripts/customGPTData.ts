export const customGPTData = {
    categories: [
        {
            name: "Website Builder",
            description: "Tools for creating landing pages, VSL scripts, and SEO content"
        },
        {
            name: "Upwork Tools", 
            description: "Tools for freelancers on Upwork platform"
        },
        {
            name: "Fiverr Tools",
            description: "Tools for freelancers on Fiverr platform"
        },
        {
            name: "Offer & Pricing Builder",
            description: "Tools for creating offers and pricing strategies"
        },
        {
            name: "Cold Email Outreach",
            description: "Tools for cold email campaigns"
        },
        {
            name: "Cold DM Outreach",
            description: "Tools for social media outreach"
        },
        {
            name: "FB Ads",
            description: "Tools for Facebook advertising"
        },
        {
            name: "High-Ticket Sales",
            description: "Tools for high-value sales processes"
        },
        {
            name: "Client Onboarding",
            description: "Tools for client onboarding processes"
        },
        {
            name: "Email Marketing",
            description: "Tools for email marketing campaigns"
        },
        {
            name: "Ad / Landing Creative Vault",
            description: "Library of creative assets and copy"
        },
        {
            name: "Resources & Leaderboard",
            description: "Best practices and community resources"
        }
    ],
    models: [
        // 1. Website Builder
        {
            name: "Landing Page Copy Generator",
            description: "Generate complete landing page copy with headlines, CTAs, and sections",
            categoryName: "Website Builder",
            masterPrompt: "You are a Landing Page Copy Generator specialized at creating high-converting landing page copy that drives action and conversions.",
            features: [
                {
                    name: "Primary Headline",
                    description: "Outcome-focused main headline",
                    prompt: "Generate a compelling primary headline that focuses on the outcome and benefit for the user.",
                    order: 1,
                    isOptional: false
                },
                {
                    name: "Subheadline", 
                    description: "Who you serve + how",
                    prompt: "Create a subheadline that clearly states who you serve and how you help them.",
                    order: 2,
                    isOptional: false
                },
                {
                    name: "Primary CTA",
                    description: "Action verb call-to-action",
                    prompt: "Generate a strong primary call-to-action button text with action verbs.",
                    order: 3,
                    isOptional: false
                },
                {
                    name: "Social Proof Mini-line",
                    description: "Trusted by mini-line",
                    prompt: "Create a social proof line that builds trust and credibility.",
                    order: 4,
                    isOptional: false
                },
                {
                    name: "Why Us Section",
                    description: "Benefits and unique selling points",
                    prompt: "Generate a 'Why Us' section highlighting key benefits and unique selling points.",
                    order: 5,
                    isOptional: false
                },
                {
                    name: "Services / Packages Snapshot",
                    description: "Services / Packages overview",
                    prompt: "Create a brief overview of services or packages offered.",
                    order: 6,
                    isOptional: false
                },
                {
                    name: "Process / How It Works",
                    description: "How it works explanation",
                    prompt: "Explain the process or how your service works in simple steps.",
                    order: 7,
                    isOptional: false
                },
                {
                    name: "FAQs / Objection Handling",
                    description: "Frequently asked questions and objection handling",
                    prompt: "Generate relevant FAQs that address common objections and concerns.",
                    order: 8,
                    isOptional: false
                }
            ]
        },
        {
            name: "VSL Script Writer",
            description: "Create compelling video sales letter scripts",
            categoryName: "Website Builder",
            masterPrompt: "You are a VSL Script Writer specialized at creating high-converting video sales letter scripts that engage viewers and drive sales.",
            features: [
                {
                    name: "VSL Script",
                    description: "Complete video sales letter script",
                    prompt: "Create a compelling video sales letter script that follows proven conversion principles.",
                    order: 1,
                    isOptional: false
                },
                {
                    name: "Summary Text",
                    description: "Side summary for the VSL",
                    prompt: "Generate a concise summary text that can be displayed alongside the VSL.",
                    order: 2,
                    isOptional: false
                }
            ]
        },
        {
            name: "SEO Meta Writer",
            description: "Generate SEO-optimized meta titles and descriptions",
            categoryName: "Website Builder",
            masterPrompt: "You are an SEO Meta Writer specialized at creating search engine optimized meta titles and descriptions that improve click-through rates.",
            features: [
                {
                    name: "Titles",
                    description: "SEO-optimized page titles",
                    prompt: "Generate compelling, SEO-optimized page titles that include target keywords.",
                    order: 1,
                    isOptional: false
                },
                {
                    name: "Description",
                    description: "Meta descriptions for search results",
                    prompt: "Create engaging meta descriptions that encourage clicks from search results.",
                    order: 2,
                    isOptional: false
                },
                {
                    name: "Meta Tags",
                    description: "Additional meta tags for SEO",
                    prompt: "Generate relevant meta tags to improve search engine visibility.",
                    order: 3,
                    isOptional: false
                }
            ]
        },

        // 2. Upwork Tools
        {
            name: "Job Feed Filter & Bid Analyzer",
            description: "Filter and analyze Upwork job feeds and bids",
            categoryName: "Upwork Tools",
            masterPrompt: "You are a Job Feed Filter & Bid Analyzer specialized at filtering relevant jobs and analyzing bid strategies.",
            features: []
        },
        {
            name: "Proposal Builder",
            description: "Create winning Upwork proposals",
            categoryName: "Upwork Tools",
            masterPrompt: "You are a Proposal Builder specialized at creating compelling Upwork proposals that win projects and attract high-paying clients.",
            features: []
        },
        {
            name: "Profile Optimizer",
            description: "Optimize your Upwork profile for maximum visibility",
            categoryName: "Upwork Tools",
            masterPrompt: "You are a Profile Optimizer specialized at creating compelling Upwork profiles that attract high-quality clients and increase job success.",
            features: []
        },
        {
            name: "Reply & Follow-Up Coach",
            description: "Generate effective client replies and follow-ups",
            categoryName: "Upwork Tools",
            masterPrompt: "You are a Reply & Follow-Up Coach specialized at creating effective client communications that build relationships and close deals.",
            features: [
                {
                    name: "Instant Reply Composer",
                    description: "Quick response templates",
                    prompt: "Generate quick, professional responses to common client messages.",
                    order: 1,
                    isOptional: false
                },
                {
                    name: "Objection Response Library",
                    description: "Handle client objections effectively",
                    prompt: "Create responses to common client objections and concerns.",
                    order: 2,
                    isOptional: false
                },
                {
                    name: "Silent Prospect Nudge Templates",
                    description: "Follow-up messages for non-responsive clients",
                    prompt: "Generate polite follow-up messages to re-engage non-responsive clients.",
                    order: 3,
                    isOptional: false
                }
            ]
        },
        {
            name: "Niche & Rate Analyzer",
            description: "Analyze niches and competitive rates",
            categoryName: "Upwork Tools",
            masterPrompt: "You are a Niche & Rate Analyzer specialized at analyzing market niches and competitive pricing strategies.",
            features: []
        },

        // 3. Fiverr Tools
        {
            name: "Gig Builder",
            description: "Create compelling Fiverr gig listings",
            categoryName: "Fiverr Tools",
            masterPrompt: "You are a Gig Builder specialized at creating high-converting Fiverr gig listings that attract buyers and increase sales.",
            features: [
                {
                    name: "Title",
                    description: "Compelling gig title with keywords",
                    prompt: "Create a compelling gig title that includes relevant keywords and value proposition.",
                    order: 1,
                    isOptional: false
                },
                {
                    name: "Tags",
                    description: "Optimized tags for visibility",
                    prompt: "Suggest relevant tags that will improve gig visibility in search results.",
                    order: 2,
                    isOptional: false
                },
                {
                    name: "Description",
                    description: "Detailed gig description",
                    prompt: "Write a compelling gig description that clearly explains your service and benefits.",
                    order: 3,
                    isOptional: false
                },
                {
                    name: "FAQ & Requirements",
                    description: "Common questions and requirements",
                    prompt: "Create relevant FAQs and requirements that help buyers understand your service.",
                    order: 4,
                    isOptional: false
                }
            ]
        },
        {
            name: "Pricing & Package Helper",
            description: "Design profitable pricing packages",
            categoryName: "Fiverr Tools",
            masterPrompt: "You are a Pricing & Package Helper specialized at creating profitable pricing strategies that maximize revenue while providing value.",
            features: [
                {
                    name: "3 Tier Packages",
                    description: "Basic, Standard, and Premium packages",
                    prompt: "Design three-tier pricing packages that offer clear value progression.",
                    order: 1,
                    isOptional: false
                },
                {
                    name: "Upsells",
                    description: "Additional services and add-ons",
                    prompt: "Create compelling upsell offers that increase order value.",
                    order: 2,
                    isOptional: false
                }
            ]
        },
        {
            name: "Auto-Responder & Delivery Messages",
            description: "Create automated client communication",
            categoryName: "Fiverr Tools",
            masterPrompt: "You are an Auto-Responder & Delivery Messages specialist who creates professional automated communications that enhance client experience.",
            features: [
                {
                    name: "Project Start",
                    description: "Welcome and project initiation message",
                    prompt: "Create a professional project start message that sets expectations.",
                    order: 1,
                    isOptional: false
                },
                {
                    name: "Delivery",
                    description: "Project delivery message",
                    prompt: "Write a professional delivery message that showcases the completed work.",
                    order: 2,
                    isOptional: false
                },
                {
                    name: "Revision Follow-Up",
                    description: "Revision request handling",
                    prompt: "Generate professional responses to revision requests.",
                    order: 3,
                    isOptional: false
                }
            ]
        },

        // 4. Offer & Pricing Builder
        {
            name: "Ideal Client Avatar Generator",
            description: "Create detailed ideal client personas",
            categoryName: "Offer & Pricing Builder",
            masterPrompt: "You are an Ideal Client Avatar Generator specialized at creating detailed client personas that help target the right audience.",
            features: []
        },
        {
            name: "One-Sentence Value Proposition Creator",
            description: "Create compelling value propositions (Sabri Subi, Alex Hormozi style)",
            categoryName: "Offer & Pricing Builder",
            masterPrompt: "You are a One-Sentence Value Proposition Creator specialized at crafting powerful value propositions that immediately communicate value and drive action.",
            features: []
        },
        {
            name: "Outcome-Based Offer Builder",
            description: "Create offers focused on results (Sabri Subi, Alex Hormozi style)",
            categoryName: "Offer & Pricing Builder",
            masterPrompt: "You are an Outcome-Based Offer Builder specialized at creating offers that focus on results and transformations rather than features.",
            features: []
        },
        {
            name: "Packaging Your Transformation",
            description: "Package your transformation into compelling offers",
            categoryName: "Offer & Pricing Builder",
            masterPrompt: "You are a Transformation Packaging specialist who helps package transformations into compelling, high-value offers.",
            features: []
        },

        // 5. Cold Email Outreach
        {
            name: "Buyer Persona",
            description: "Create detailed buyer personas for cold email campaigns",
            categoryName: "Cold Email Outreach",
            masterPrompt: "You are a Buyer Persona specialist who creates detailed personas to help craft targeted cold email campaigns.",
            features: []
        },
        {
            name: "First-Touch Email Generator",
            description: "Create compelling first-touch cold emails",
            categoryName: "Cold Email Outreach",
            masterPrompt: "You are a First-Touch Email Generator specialized at creating cold emails that get opened, read, and responded to.",
            features: [
                {
                    name: "Subject Lines",
                    description: "Attention-grabbing subject lines",
                    prompt: "Generate compelling subject lines that increase open rates.",
                    order: 1,
                    isOptional: false
                },
                {
                    name: "Previews",
                    description: "Email preview text",
                    prompt: "Create engaging preview text that encourages opens.",
                    order: 2,
                    isOptional: false
                },
                {
                    name: "Initial Email",
                    description: "Complete first-touch email",
                    prompt: "Write a compelling first-touch email that builds interest and encourages response.",
                    order: 3,
                    isOptional: false
                }
            ]
        },
        {
            name: "Follow-Up Sequence Builder",
            description: "Create effective follow-up email sequences",
            categoryName: "Cold Email Outreach",
            masterPrompt: "You are a Follow-Up Sequence Builder specialized at creating email sequences that nurture prospects and drive responses.",
            features: []
        },
        {
            name: "Objection Handling Snippets",
            description: "Create responses to common objections",
            categoryName: "Cold Email Outreach",
            masterPrompt: "You are an Objection Handling specialist who creates effective responses to common cold email objections.",
            features: []
        },

        // 6. Cold DM Outreach
        {
            name: "LinkedIn Script Builder",
            description: "Create effective LinkedIn outreach scripts",
            categoryName: "Cold DM Outreach",
            masterPrompt: "You are a LinkedIn Script Builder specialized at creating connection requests and messages that get responses.",
            features: []
        },
        {
            name: "Instagram DM Opener",
            description: "Create engaging Instagram DM openers",
            categoryName: "Cold DM Outreach",
            masterPrompt: "You are an Instagram DM Opener specialist who creates messages that get responses on Instagram.",
            features: []
        },
        {
            name: "Follow-Up Planner",
            description: "Plan effective follow-up sequences",
            categoryName: "Cold DM Outreach",
            masterPrompt: "You are a Follow-Up Planner who creates strategic follow-up sequences for social media outreach.",
            features: []
        },

        // 7. FB Ads
        {
            name: "Ad Creative Generator",
            description: "Create compelling Facebook ad creatives",
            categoryName: "FB Ads",
            masterPrompt: "You are an Ad Creative Generator specialized at creating Facebook ads that drive clicks and conversions.",
            features: [
                {
                    name: "Primary Text",
                    description: "Main ad copy",
                    prompt: "Write compelling primary text that engages the audience and drives action.",
                    order: 1,
                    isOptional: false
                },
                {
                    name: "Headline",
                    description: "Attention-grabbing headline",
                    prompt: "Create an attention-grabbing headline that increases click-through rates.",
                    order: 2,
                    isOptional: false
                },
                {
                    name: "Description",
                    description: "Supporting ad description",
                    prompt: "Write a supporting description that reinforces the main message.",
                    order: 3,
                    isOptional: false
                },
            ]
        },
        {
            name: "Visual Hook Prompts",
            description: "Prompts for creating visual hooks",
            categoryName: "FB Ads",
            masterPrompt: "You are a Visual Hook Prompts specialist who provides prompts for creating visual hooks that capture attention.",
            features: []
        },
        {
            name: "Audience Targeting Suggestions",
            description: "Generate audience targeting recommendations",
            categoryName: "FB Ads",
            masterPrompt: "You are an Audience Targeting specialist who provides strategic recommendations for Facebook ad targeting.",
            features: []
        },

        // 8. High-Ticket Sales
        {
            name: "Call Prep & Script Builder",
            description: "Prepare for high-ticket sales calls",
            categoryName: "High-Ticket Sales",
            masterPrompt: "You are a Call Prep & Script Builder specialized at preparing for high-value sales calls that close deals.",
            features: []
        },
        {
            name: "Live Objection Role Play",
            description: "Practice handling objections in real-time",
            categoryName: "High-Ticket Sales",
            masterPrompt: "You are a Live Objection Role Play specialist who helps practice handling objections in real-time scenarios.",
            features: []
        },
        {
            name: "Pitch Deck Generator",
            description: "Create compelling pitch decks",
            categoryName: "High-Ticket Sales",
            masterPrompt: "You are a Pitch Deck Generator specialized at creating compelling presentations that close high-ticket sales.",
            features: []
        },
        {
            name: "Automated Sequence Builder",
            description: "Create automated follow-up sequences",
            categoryName: "High-Ticket Sales",
            masterPrompt: "You are an Automated Sequence Builder specialized at creating follow-up sequences that nurture prospects and close deals.",
            features: [
                {
                    name: "Book a Call",
                    description: "Sequence to book discovery calls",
                    prompt: "Create a sequence to encourage prospects to book discovery calls.",
                    order: 1,
                    isOptional: false
                },
                {
                    name: "No Show",
                    description: "Follow-up for missed calls",
                    prompt: "Generate follow-up messages for prospects who don't show up to calls.",
                    order: 2,
                    isOptional: false
                },
                {
                    name: "After Call",
                    description: "Post-call follow-up sequence",
                    prompt: "Create a follow-up sequence for after the discovery call.",
                    order: 3,
                    isOptional: false
                }
            ]
        },

        // 9. Client Onboarding
        {
            name: "Intake Form Creator",
            description: "Create comprehensive client intake forms",
            categoryName: "Client Onboarding",
            masterPrompt: "You are an Intake Form Creator specialized at designing forms that gather essential client information efficiently.",
            features: []
        },
        {
            name: "Welcome Email / Packet Builder",
            description: "Create welcoming onboarding communications",
            categoryName: "Client Onboarding",
            masterPrompt: "You are a Welcome Email & Packet Builder specialized at creating welcoming communications that set the right expectations.",
            features: []
        },
        {
            name: "Kick-Off Checklist & Timeline Template",
            description: "Create project kick-off materials",
            categoryName: "Client Onboarding",
            masterPrompt: "You are a Kick-Off specialist who creates checklists and timelines that ensure smooth project starts.",
            features: []
        },
        {
            name: "Client Agreement",
            description: "Create professional client agreements",
            categoryName: "Client Onboarding",
            masterPrompt: "You are a Client Agreement specialist who creates professional contracts that protect both parties.",
            features: []
        },

        // 10. Email Marketing
        {
            name: "Newsletter Draft AI",
            description: "Create engaging newsletter content",
            categoryName: "Email Marketing",
            masterPrompt: "You are a Newsletter Draft AI specialized at creating engaging email newsletters that build relationships and drive engagement.",
            features: []
        },
        {
            name: "Promo Campaign Wizard",
            description: "Create promotional email campaigns",
            categoryName: "Email Marketing",
            masterPrompt: "You are a Promo Campaign Wizard specialized at creating promotional email campaigns that drive sales and conversions.",
            features: []
        },
        {
            name: "Subject-Line Tester",
            description: "Test and optimize email subject lines",
            categoryName: "Email Marketing",
            masterPrompt: "You are a Subject-Line Tester specialized at creating and testing email subject lines that maximize open rates.",
            features: []
        },

        // 11. Ad / Landing Creative Vault
        {
            name: "Swipeable Hook Library",
            description: "Library of proven hooks by niche/angle",
            categoryName: "Ad / Landing Creative Vault",
            masterPrompt: "You are a Swipeable Hook Library specialist who provides proven hooks and angles for different niches.",
            features: []
        },
        {
            name: "Winning Copy Examples",
            description: "Proven copy examples and templates",
            categoryName: "Ad / Landing Creative Vault",
            masterPrompt: "You are a Winning Copy Examples specialist who provides proven copy templates and examples.",
            features: []
        },

        // 12. Resources & Leaderboard
        {
            name: "Best-Practice Guides",
            description: "Best practices for each tool category",
            categoryName: "Resources & Leaderboard",
            masterPrompt: "You are a Best-Practice Guides specialist who provides comprehensive best practices for different marketing tools and strategies.",
            features: []
        },
        {
            name: "Community Template Gallery",
            description: "User-submitted, upvoted templates",
            categoryName: "Resources & Leaderboard",
            masterPrompt: "You are a Community Template Gallery curator who helps organize and showcase community-contributed templates.",
            features: []
        },
        {
            name: "Performance Leaderboards & Scorecards",
            description: "Track and compare performance metrics",
            categoryName: "Resources & Leaderboard",
            masterPrompt: "You are a Performance Leaderboards specialist who helps track, compare, and improve performance metrics.",
            features: []
        }
    ]
};