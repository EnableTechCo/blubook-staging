export type PublicContentItem = {
  title: string;
  subtitle?: string;
  paragraphs?: string[];
  bullets?: string[];
  quote?: string;
};

export type PublicContentSection = {
  id: string;
  kicker?: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  items?: PublicContentItem[];
};

export type PublicPageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PublicContentSection[];
};

export const publicPages: Record<string, PublicPageContent> = {};

publicPages["why-blubook"] = {
  eyebrow: "Why BluBook",
  title: "The foundation businesses need to thrive",
  intro:
    "BluBook is a revolutionary business enablement platform designed to help small and medium-sized enterprises compete, grow, and scale with confidence.",
  sections: [
    {
      id: "who-we-are",
      kicker: "Our purpose",
      title: "Who We Are",
      paragraphs: [
        "We level the playing field by giving businesses access to enterprise-grade corporate services, operational infrastructure, regulatory compliance, and innovation support, all without the cost and complexity typically associated with large organisations. Through our shared services model, we unlock economies of scale that dramatically reduce operational costs while empowering entrepreneurs to focus on what matters most: building their businesses and selling their products.",
        "At the same time, BluBook serves as a strategic partner to government institutions, development agencies, and empowerment programmes seeking sustainable solutions for SMME development, job creation, and economic transformation.",
        "Our purpose is simple: to help businesses thrive by providing the foundation, support, and innovation they need to succeed.",
      ],
    },
    {
      id: "our-story",
      title: "Our Story",
      paragraphs: [
        "BluBook was created to solve one of the biggest challenges facing small businesses: the high cost and complexity of running a compliant, scalable organisation. Too many entrepreneurs spend valuable time and resources managing administration, governance, compliance, and operational processes instead of focusing on growth, customers, and innovation.",
        "By combining enterprise-grade corporate services, shared administrative infrastructure, and business growth programmes into a single platform, BluBook enables businesses to access capabilities previously reserved for large corporations. Today, BluBook is helping businesses build stronger foundations, scale faster, reduce costs, and unlock new opportunities, while supporting public sector initiatives aimed at creating inclusive economic growth and sustainable community development.",
      ],
    },
    {
      id: "vision-and-mission",
      title: "Our Vision and Mission",
      items: [
        {
          title: "Our Vision",
          paragraphs: ["To create a thriving ecosystem where every small and medium-sized business has access to the tools, support, and infrastructure needed to compete at enterprise standards and achieve sustainable growth."],
        },
        {
          title: "Our Mission",
          paragraphs: ["We empower businesses by providing world-class corporate services, compliance management, operational support, and innovation programmes that eliminate barriers to growth. Through strategic partnerships with both the private and public sectors, we enable entrepreneurship, accelerate job creation, and strengthen local economies."],
        },
      ],
    },
    {
      id: "what-makes-us-different",
      title: "What Makes BluBook Different",
      items: [
        {
          title: "Foundation Meets Innovation",
          paragraphs: ["Every successful business needs a solid foundation. BluBook provides the essential corporate structures, governance frameworks, and compliance support necessary for businesses to operate with confidence while creating the space for innovation and growth."],
        },
        {
          title: "Scale Without Capital",
          paragraphs: ["Our shared service model enables businesses to access enterprise-level capabilities without significant capital investment. By reducing operational expenditure and eliminating unnecessary overheads, we create the financial runway businesses need to invest in growth, innovation, and skills development."],
        },
        {
          title: "Mind to Market, Seamlessly",
          paragraphs: ["We combine operational excellence with business acceleration initiatives to help organisations mature faster, build internal capability, and bring ideas to market more effectively."],
        },
      ],
    },
    {
      id: "our-values",
      title: "Our Values",
      items: [
        { title: "Empowerment", paragraphs: ["We exist to empower entrepreneurs, businesses, and communities by removing barriers to growth and creating pathways to success."] },
        { title: "Integrity", paragraphs: ["We operate with transparency, accountability, and professionalism, building trusted relationships with our clients, partners, and stakeholders."] },
        { title: "Innovation", paragraphs: ["We continuously seek better ways to help businesses operate, grow, and succeed in an ever-changing environment."] },
        { title: "Collaboration", paragraphs: ["We believe sustainable success comes from working together across businesses, communities, government institutions, and industry partners."] },
        { title: "Impact", paragraphs: ["Everything we do is measured by the value and positive outcomes we create for businesses, people, and communities."] },
      ],
    },
    {
      id: "corporate-responsibility",
      title: "Corporate Responsibility",
      paragraphs: [
        "At BluBook, corporate responsibility is at the heart of our business model. We believe that sustainable economic growth starts with enabling small businesses to succeed. By providing entrepreneurs with the operational infrastructure, tools, and support they need, we contribute directly to job creation, business sustainability, and community development.",
        "Our commitment extends beyond business success to creating long-term social and economic value for the communities we serve.",
      ],
      bullets: [
        "Sustainable small business development",
        "Localised job creation",
        "Capacity building and skills development",
        "Improved regulatory compliance",
        "Reduced business failure rates",
        "Economic inclusion and transformation",
        "Measurable community upliftment",
      ],
    },
    {
      id: "sustainability",
      title: "Sustainability",
      paragraphs: [
        "Our approach to sustainability focuses on creating lasting economic resilience rather than short-term interventions. BluBook builds sustainable business capacity by helping organisations establish strong operational foundations, improve governance, embrace innovation, and develop future-ready skills.",
        "You focus on growing your business and selling your products. We take care of the structure, compliance, administration, and growth support that enables you to scale without limits.",
      ],
    },
  ],
};

publicPages["our-team"] = {
  eyebrow: "Our Team",
  title: "Leadership with purpose",
  intro:
    "BluBook's leadership team brings together decades of expertise across technology, business operations, enterprise development, sales, stakeholder engagement, and community empowerment.",
  sections: [
    {
      id: "executive-team",
      kicker: "Experience that creates impact",
      title: "Executive Team",
      paragraphs: [
        "United by a shared vision, the executive team is committed to building an ecosystem that enables entrepreneurs, strengthens businesses, and creates sustainable economic growth. Together, they drive BluBook's mission to provide enterprise-grade support, operational excellence, and scalable growth opportunities for businesses across South Africa.",
      ],
      items: [
        {
          title: "Tumi Maimela",
          subtitle: "Chief Information Officer (CIO)",
          paragraphs: [
            "Tumi Maimela is a seasoned technology executive with more than two decades of experience working across some of the world's leading global technology organisations. His extensive background spans information technology strategy, digital transformation, client success, and enterprise service delivery.",
            "As Chief Information Officer, Tumi is responsible for ensuring that BluBook's technology platforms remain innovative, scalable, secure, and aligned to the needs of the businesses we serve.",
          ],
          quote: "Technology should do more than support a business. It should unlock its potential.",
        },
        {
          title: "Thina Ramanugu",
          subtitle: "Chief Sales Officer (CSO)",
          paragraphs: [
            "Thina Ramanugu is a dynamic business leader, entrepreneur, and growth strategist with extensive experience in enterprise development, business expansion, and commercial leadership.",
            "At BluBook, Thina leads the commercial strategy, client engagement, and business development functions. His ability to connect business opportunities with innovative solutions ensures that BluBook remains focused on delivering measurable value to clients across the private and public sectors.",
          ],
          quote: "Business growth starts with understanding people, creating value, and delivering outcomes that matter.",
        },
        {
          title: "Nqobile Memo",
          subtitle: "Chief Operations Officer (COO)",
          paragraphs: [
            "Nqobile Memo brings more than 20 years of international experience in information technology services, operations management, customer success, and organisational leadership.",
            "As Chief Operations Officer, he is responsible for driving operational excellence across the BluBook ecosystem, ensuring that businesses receive world-class support, efficient service delivery, and scalable operational frameworks.",
          ],
          quote: "Sustainable growth is built on operational excellence, disciplined execution, and a relentless focus on customer success.",
        },
        {
          title: "Kanasa Mthembu",
          subtitle: "Chief Public Relations Officer (CPRO)",
          paragraphs: [
            "Kanasa Mthembu is an accomplished technology professional, business leader, and strategic communications specialist with extensive experience across the African technology landscape.",
            "As Chief Public Relations Officer, Kanasa leads BluBook's stakeholder engagement, communications, partnerships, and reputation management initiatives. He plays a vital role in strengthening relationships with clients, government entities, development agencies, and the broader business community.",
          ],
          quote: "Strong relationships create strong businesses, and strong businesses build stronger communities.",
        },
        {
          title: "Hastings Mulenga",
          subtitle: "Chief Corporate Social Responsibility Officer (CCSRO)",
          paragraphs: [
            "Hastings Mulenga serves as the emotional heartbeat of BluBook's social impact mission. With a deep passion for community development, social upliftment, and inclusive economic growth, he is dedicated to ensuring that BluBook's success creates meaningful value beyond business outcomes.",
            "As Chief Corporate Social Responsibility Officer, he leads BluBook's community engagement, social impact, and empowerment initiatives.",
          ],
          quote: "When we empower businesses, we create jobs. When we create jobs, we transform communities.",
        },
      ],
    },
    {
      id: "non-executive-directors",
      kicker: "Independent insight and strategic guidance",
      title: "Non-Executive Directors",
      paragraphs: [
        "BluBook's Non-Executive Directors provide independent oversight, strategic counsel, and deep industry expertise that strengthen our governance and support our long-term vision.",
      ],
      items: [
        {
          title: "Advocate James Magodi",
          subtitle: "Non-Executive Director",
          paragraphs: [
            "Advocate James Magodi is a distinguished legal practitioner and respected member of the Johannesburg Bar with extensive experience in law, governance, financial advisory, and the administration of justice. Currently serving as an Acting Judge, Advocate Magodi brings a unique combination of legal expertise, commercial insight, and public sector experience to the BluBook Board.",
            "His expertise in governance, risk management, compliance, and regulatory frameworks provides invaluable guidance as BluBook continues to build a trusted and sustainable business ecosystem.",
          ],
          quote: "Strong governance is the foundation upon which sustainable enterprises and thriving economies are built.",
        },
        {
          title: "Professor Ernest Mnkandla",
          subtitle: "Non-Executive Director",
          paragraphs: [
            "Professor Ernest Mnkandla is an internationally recognised academic, researcher, and thought leader in Software Engineering and Artificial Intelligence, currently serving as Professor of Software Engineering and Artificial Intelligence at the University of South Africa.",
            "As a member of the BluBook Board, Professor Mnkandla provides strategic insight into technology, innovation, digital transformation, and future trends.",
          ],
          quote: "Innovation delivers its greatest value when it is applied to solve real-world challenges and improve people's lives.",
        },
        {
          title: "Lizwe Nkala",
          subtitle: "Non-Executive Director",
          paragraphs: [
            "Lizwe Nkala is a respected strategist, executive coach, entrepreneur, and business advisor with decades of experience working with Boards, Chief Executive Officers, and senior leadership teams across a wide range of industries.",
            "At BluBook, Lizwe provides invaluable guidance on long-term growth, organisational maturity, leadership effectiveness, and value creation strategy.",
          ],
          quote: "The most successful organisations are those that align purpose, strategy, leadership, and execution.",
        },
        {
          title: "Tasneem Mohamed",
          subtitle: "Non-Executive Director",
          paragraphs: [
            "Tasneem Mohamed is a leading Innovation Management and Creativity Strategist whose work has helped organisations embed innovation as a core business capability rather than an isolated activity.",
            "As a Non-Executive Director at BluBook, Tasneem provides valuable insight into innovation strategy, future readiness, organisational creativity, and growth enablement.",
          ],
          quote: "Innovation is not about having ideas. It is about creating environments where great ideas can thrive and deliver meaningful outcomes.",
        },
      ],
    },
    {
      id: "future",
      title: "Leading the Future of Enterprise Development",
      paragraphs: [
        "BluBook's executive team combines global experience, entrepreneurial thinking, operational expertise, and a deep commitment to economic transformation. Our leadership team is united by one goal: helping businesses achieve enterprise-level success while driving sustainable economic growth and community upliftment.",
        "The independent perspectives and collective experience of our Non-Executive Directors help ensure that BluBook remains focused on its mission of empowering SMMEs, supporting economic transformation, and delivering sustainable impact for businesses and communities alike.",
      ],
    },
  ],
};

publicPages["our-services"] = {
  eyebrow: "Our Services",
  title: "Enterprise capability without enterprise costs",
  intro:
    "BluBook combines enterprise-grade corporate services, strategic business expertise, shared operational infrastructure, and growth-focused innovation programmes within a single platform.",
  sections: [
    {
      id: "enterprise-development",
      title: "The Enterprise Development Programme",
      paragraphs: [
        "BluBook is more than a service provider. We are a business growth partner dedicated to helping SMMEs operate with the confidence, structure, and capability of large enterprises.",
        "Our Enterprise Development Programme provides businesses with access to world-class corporate services, governance frameworks, operational support, and growth-enablement tools that are traditionally only available to large organisations. Through our shared services model, we aggregate critical business functions and infrastructure, creating powerful economies of scale that dramatically reduce both capital and operational expenditure.",
      ],
      bullets: [
        "Enterprise-grade business infrastructure without enterprise costs",
        "Reduced operational and administrative overheads",
        "Improved governance and compliance management",
        "Access to scalable shared services",
        "Increased business sustainability and resilience",
        "Enhanced operational efficiency and productivity",
        "Support for long-term growth and expansion",
      ],
    },
    {
      id: "business-activation",
      title: "Business Activation",
      kicker: "Turning business complexity into commercial clarity",
      paragraphs: [
        "Many businesses believe their greatest challenge is visibility. In reality, the biggest obstacle is often a lack of strategic clarity. Too often organisations respond to growth challenges by producing more content, launching more campaigns, and adopting more platforms, creating additional complexity rather than meaningful progress.",
        "Our Business Activation service is designed to help organisations make better decisions by simplifying complexity, clarifying strategic direction, and creating a clear path from vision to execution.",
      ],
      bullets: [
        "Strategic business positioning",
        "Brand and commercial narrative development",
        "Growth planning and activation strategies",
        "Stakeholder communication frameworks",
        "Organisational alignment workshops",
        "Business model refinement",
        "Decision-support and strategic advisory services",
      ],
    },
    {
      id: "asset-finance",
      title: "Asset Finance",
      kicker: "Access technology and equipment without capital constraints",
      paragraphs: [
        "The ability to scale often depends on having the right technology, equipment, and infrastructure. However, substantial upfront capital expenditure can limit growth opportunities and strain cash flow.",
        "BluBook's Asset Finance solution provides organisations with a smarter, more affordable alternative to traditional asset procurement. Through our operating lease model, businesses can acquire critical equipment and technology while preserving capital and maintaining financial flexibility.",
      ],
      items: [
        { title: "Eliminate Large Upfront Capital Costs", paragraphs: ["Our leasing model allows businesses to spread costs over a manageable contract period, freeing up resources for strategic initiatives and operational growth."] },
        { title: "Preserve Cash Flow", paragraphs: ["By eliminating the need for upfront capital investment, businesses can redirect cash toward expansion, product development, staffing, and innovation."] },
        { title: "Reduce Total Cost of Ownership", paragraphs: ["Our financing model combines competitive pricing, below-prime funding structures, asset lifecycle management, and pay-for-use benefits to reduce the overall cost of acquiring and managing technology assets."] },
      ],
      bullets: [
        "No upfront capital expenditure",
        "Improved cash flow management",
        "Lower acquisition costs",
        "Flexible financing structures",
        "Access to modern technology",
        "Asset lifecycle management support",
        "Reduced financial risk",
      ],
    },
    {
      id: "management-consulting",
      title: "Management Consulting",
      kicker: "Transforming organisations through strategic thinking",
      paragraphs: [
        "BluBook's Management Consulting practice helps organisations strengthen their strategic foundations, uncover their unique competitive advantages, and build sustainable pathways for growth and value creation.",
        "We work closely with executive teams, business leaders, and public sector organisations to develop practical strategies that improve performance, strengthen execution, and create measurable impact.",
      ],
      items: [
        { title: "Strategic Business Analysis", paragraphs: ["Comprehensive assessments that evaluate your organisation's current position, competitive strengths, operational effectiveness, and long-term growth opportunities."] },
        { title: "Executive Leadership Coaching", paragraphs: ["One-on-one and team-based coaching focused on strategic leadership, decision-making, organisational transformation, and short- and long-term planning frameworks."] },
        { title: "Corporate and Business Unit Strategy Development", paragraphs: ["Facilitated strategy design and implementation programmes that align organisational capabilities, market opportunities, and business objectives."] },
        { title: "Organisational Transformation", paragraphs: ["Development of value creation models, operating structures, and execution frameworks that improve organisational performance and support sustainable growth."] },
      ],
      bullets: [
        "Stronger strategic leadership",
        "Clearer organisational direction",
        "Improved business performance",
        "Enhanced competitive positioning",
        "Sustainable growth pathways",
        "Increased organisational resilience",
      ],
    },
    {
      id: "why-choose-blubook",
      title: "Why Choose BluBook?",
      paragraphs: [
        "Whether you are an entrepreneur looking to scale, a growing business seeking operational efficiency, or a government institution focused on economic development, BluBook provides the tools, expertise, and support needed to create sustainable success.",
        "You focus on growing your business. We provide the structure, support, and scale that make growth possible.",
      ],
    },
  ],
};

publicPages["our-partners"] = {
  eyebrow: "Our Partners",
  title: "Partnerships that turn investment into impact",
  intro:
    "BluBook works across the private and public sectors to enable entrepreneurship, accelerate job creation, and strengthen local economies.",
  sections: [
    {
      id: "strategic-partner",
      title: "A Strategic Platform for Enterprise Development",
      paragraphs: [
        "BluBook serves as a strategic partner to government institutions, development agencies, and empowerment programmes seeking sustainable solutions for SMME development, job creation, and economic transformation.",
        "Beyond supporting individual businesses, BluBook also serves government departments, municipalities, state-owned entities, development agencies, and corporate enterprise development initiatives seeking measurable outcomes in SMME empowerment, job creation, economic inclusion, and community upliftment.",
      ],
    },
    {
      id: "economic-development",
      title: "Supporting Government and Economic Development",
      paragraphs: [
        "BluBook provides government institutions, municipalities, state-owned entities, and development agencies with a practical and scalable solution for delivering on SMME empowerment mandates.",
        "By equipping businesses with international-standard organisational tools and shared corporate infrastructure, we help transform public investment into long-term economic impact.",
      ],
      bullets: [
        "Sustainable small business development",
        "Localised job creation",
        "Capacity building and skills development",
        "Improved regulatory compliance",
        "Reduced business failure rates",
        "Economic inclusion and transformation",
        "Measurable community upliftment",
      ],
    },
    {
      id: "shared-impact",
      title: "Shared Commitment, Measurable Outcomes",
      paragraphs: [
        "Our commitment extends beyond business success to creating long-term social and economic value for the communities we serve.",
        "Through strategic partnerships with both the private and public sectors, we enable entrepreneurship, accelerate job creation, and strengthen local economies.",
      ],
    },
  ],
};

publicPages["our-people"] = {
  eyebrow: "Our People",
  title: "Building businesses and empowering communities",
  intro:
    "At BluBook, our people are the driving force behind everything we do. We are united by a common purpose: helping businesses unlock their full potential.",
  sections: [
    {
      id: "our-people",
      title: "Our People",
      paragraphs: [
        "We are a diverse team of business professionals, compliance specialists, strategists, consultants, financial experts, administrators, and development practitioners.",
        "We understand that behind every small business is an entrepreneur with a vision, a dream, and the determination to succeed. Our role is to provide the expertise, structure, and support that transforms ambition into sustainable growth.",
        "Whether we are helping a start-up establish strong governance, supporting a growing business through expansion, or enabling a government initiative to deliver meaningful economic impact, our people bring passion, professionalism, and a commitment to excellence to every engagement.",
      ],
    },
    {
      id: "culture",
      title: "Our Culture",
      paragraphs: [
        "At BluBook, we believe that great businesses are built by great people.",
        "Our culture is founded on collaboration, innovation, accountability, and service. We encourage curiosity, continuous learning, and entrepreneurial thinking, empowering our teams to solve problems, challenge convention, and create meaningful value for our clients and communities.",
        "We celebrate diversity of thought and experience because we know that different perspectives lead to better solutions and stronger outcomes.",
      ],
    },
    {
      id: "expertise",
      title: "Experts Dedicated to Your Success",
      paragraphs: [
        "This multidisciplinary expertise allows us to provide businesses with the enterprise-level support they need to compete, scale, and succeed.",
      ],
      bullets: [
        "Enterprise and Supplier Development",
        "Business Operations and Administration",
        "Corporate Governance and Compliance",
        "Financial Advisory and Asset Finance",
        "Business Strategy and Growth Consulting",
        "Organisational Development",
        "Leadership Development and Coaching",
        "Community and Economic Development",
        "Innovation and Business Activation",
      ],
    },
    {
      id: "empowerment",
      title: "A Shared Commitment to Empowerment",
      paragraphs: [
        "BluBook is built on the belief that empowering businesses creates stronger economies and more prosperous communities.",
        "Our people are passionate about supporting entrepreneurs, developing future business leaders, and creating sustainable pathways to economic inclusion. Every business we help strengthen contributes to job creation, community development, and long-term economic resilience.",
      ],
    },
    {
      id: "growing-together",
      title: "Growing Together",
      paragraphs: [
        "As our clients grow, we grow with them. We view every client relationship as a partnership built on trust, shared goals, and mutual success.",
        "Our teams work alongside businesses at every stage of their journey, providing the guidance, tools, and expertise needed to navigate challenges and seize opportunities. Because when businesses succeed, communities thrive.",
      ],
    },
    {
      id: "join-our-team",
      title: "Join Our Team",
      paragraphs: [
        "We are always looking for talented, passionate, and purpose-driven individuals who share our vision of empowering businesses and creating lasting impact.",
        "If you are motivated by innovation, collaboration, and the opportunity to make a meaningful difference, we'd love to hear from you.",
        "Our platform provides the structure. Our services provide the support. Our people make the difference.",
      ],
    },
  ],
};

publicPages.insights = {
  eyebrow: "Insights",
  title: "Transforming enterprise development into sustainable economic growth",
  intro:
    "South Africa has one of the most significant Enterprise and Supplier Development ecosystems in the world, yet the sustainability and success rate of many SMMEs remain a national challenge.",
  sections: [
    {
      id: "esd-opportunity",
      title: "The ESD Opportunity",
      paragraphs: [
        "Every year, corporates invest an estimated R20 billion to R30 billion into Enterprise and Supplier Development initiatives aimed at developing small businesses, creating jobs, and driving economic transformation.",
        "The Broad-Based Black Economic Empowerment framework requires large organisations to invest in Enterprise and Supplier Development as a key component of economic transformation. Large enterprises are targeted to invest 3% of Net Profit After Tax into these programmes, typically split between 1% Enterprise Development and 2% Supplier Development.",
        "At BluBook, we believe the opportunity lies not in increasing investment alone, but in improving how that investment is deployed, measured, and sustained.",
      ],
    },
    {
      id: "smme-importance",
      title: "The Importance of SMMEs",
      paragraphs: [
        "Small, Medium and Micro Enterprises are the backbone of South Africa's economy. These businesses drive innovation, support local economies, create employment opportunities, and play a critical role in reducing poverty and inequality.",
      ],
      bullets: [
        "SMMEs represent more than 98% of businesses in South Africa",
        "They contribute approximately 34% of national GDP",
        "They account for more than 60% of employment opportunities across the country",
      ],
    },
    {
      id: "high-failure-rates",
      title: "The Challenge: High Failure Rates",
      paragraphs: [
        "Studies indicate that between 70% and 80% of small businesses fail within their first five years of operation, often due to operational challenges rather than poor products or lack of market opportunity.",
      ],
      bullets: [
        "Weak governance structures",
        "Administrative burdens",
        "Regulatory compliance challenges",
        "Limited access to business support services",
        "Lack of operational infrastructure",
        "Insufficient strategic and leadership development",
        "Restricted access to scalable systems and resources",
      ],
    },
    {
      id: "uneven-access",
      title: "Uneven Access to Opportunity",
      paragraphs: [
        "Approximately 65.9% of SMME activity is concentrated in Gauteng and the Western Cape, while many rural and underdeveloped regions continue to receive limited access to formal enterprise development programmes and business support infrastructure.",
        "This creates a pressing need for scalable solutions that can extend meaningful support beyond traditional economic hubs.",
      ],
    },
    {
      id: "strategic-gap",
      title: "The Strategic Gap",
      paragraphs: [
        "Many programmes remain compliance-driven rather than impact-driven. Only 62% of participating organisations reported having a formal Enterprise and Supplier Development strategy, and many programmes continue to operate on an ad-hoc basis rather than as structured business development ecosystems.",
        "Funding alone does not build successful businesses. Sustainable growth requires structure, governance, capability, systems, leadership development, and ongoing support.",
      ],
    },
    {
      id: "blubook-perspective",
      title: "BluBook's Perspective",
      paragraphs: [
        "We believe the future of Enterprise Development lies in creating a sustainable operating environment where businesses can thrive long after funding has been allocated.",
        "Rather than focusing solely on financial assistance, BluBook provides the foundational infrastructure that enables businesses to operate with enterprise-level professionalism and efficiency.",
      ],
      bullets: [
        "Corporate governance support",
        "Regulatory compliance management",
        "Administrative outsourcing",
        "Operational infrastructure",
        "Business activation services",
        "Strategic advisory and consulting",
        "Growth acceleration programmes",
        "Asset finance solutions",
        "Innovation and capability development",
      ],
    },
    {
      id: "from-compliance-to-impact",
      title: "From Compliance to Impact",
      paragraphs: [
        "For corporates, government departments, municipalities, development agencies, and Enterprise and Supplier Development programmes, the real measure of success is not spend. The real measure is impact.",
        "BluBook helps organisations move beyond scorecard compliance toward meaningful economic development that delivers lasting value.",
      ],
      bullets: [
        "More sustainable businesses",
        "Lower failure rates",
        "Stronger local supply chains",
        "Increased job creation",
        "Greater economic participation",
        "Improved community resilience",
        "Measurable transformation outcomes",
      ],
    },
    {
      id: "looking-forward",
      title: "Looking Forward",
      paragraphs: [
        "South Africa does not have a shortage of entrepreneurial talent. What many entrepreneurs lack is access to the systems, support structures, governance frameworks, and operational capabilities that allow businesses to survive and scale.",
        "BluBook exists to close that gap. By combining enterprise-grade support services, business enablement, and economic development expertise, we help transform investment into outcomes, businesses into sustainable enterprises, and communities into thriving economic ecosystems.",
        "When small businesses are provided with the right foundation, they do more than survive. They create jobs, strengthen communities, and drive the future growth of the South African economy.",
      ],
    },
  ],
};
