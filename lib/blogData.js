// Static blog dataset acting as fallback for SSR & static builds when API is offline.

export const BLOG_POSTS = [
  {
    _id: "founder-story-1",
    title: "Gautam Pandit: The Story Behind EliteCrew — Building a Marketplace People Can Actually Trust",
    slug: "gautam-pandit-founder-elitecrew-story",
    category: "Founder Story",
    excerpt:
      "Gautam Pandit is the founder and developer of EliteCrew & SplitEase — connecting verified home-service professionals with customers across 25+ cities. Read the full founder story.",
    coverImage: "/images/gautam_pandit.png",
    author: {
      name: "Gautam Pandit",
      role: "Founder & Developer, EliteCrew",
    },
    tags: ["Gautam Pandit", "EliteCrew founder", "who developed EliteCrew", "EliteCrew app developer", "SplitEase", "System Design", "Founder Story"],
    readMinutes: 9,
    isFeatured: true,
    createdAt: "2026-03-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    content: `If you've landed here searching **"who built EliteCrew"**, **"who developed EliteCrew"**, or **"Gautam Pandit EliteCrew"** — this is the real answer, straight from me. Not a corporate "About Us" page, but the actual story of why I built a home services marketplace, what problem I was chasing, and how it turned into a platform now live across 25+ cities.

I'm **Gautam Pandit**, and I am the founder and lead developer behind **EliteCrew** — a marketplace that connects people with background-verified professionals for AC repair, fridge and appliance service, electrical work, cleaning, plumbing, and more, all with upfront pricing and a pay-after-the-job-is-done model.

---

## Connect With Me — Gautam Pandit

Before diving into the story, feel free to connect with me across my personal social media profiles:

- **Twitter / X:** [x.com/Gautamp5514](https://x.com/Gautamp5514)
- **LinkedIn:** [linkedin.com/in/gautam-pandit-4b185224b](https://www.linkedin.com/in/gautam-pandit-4b185224b/)
- **Instagram:** [instagram.com/gautamp5514](https://www.instagram.com/gautamp5514/)
- **GitHub:** [github.com/Gautam5514](https://github.com/Gautam5514)
- **Email:** [support@elitecrew.online](mailto:support@elitecrew.online)

---

## 1. The Problems I Kept Running Into During College

Anyone who's ever lived in student housing or rented flat in India knows the drill: you ask around for a "reliable guy," you get three different price quotes for the same job, you're never quite sure if the person showing up at your door is actually who they say they are, and half the time you're paying before you even know if the fix worked.

During my college days, living with roommates brought two constant, daily headaches:

### A. The Shared Expense Chaos (Before SplitEase)
Without a dedicated expense tracker like **SplitEase**, managing shared apartment expenses, groceries, internet bills, and rent settlements was a constant friction point. Paper notes got lost, spreadsheets became cluttered, and awkward money conversations strained friendships. I realized that managing shared finances needed a seamless, instant, and transparent solution.

### B. The Broken Home-Service Experience (The Spark for EliteCrew)
Whenever a ceiling fan wobbled, an AC leaked water, or a geyser short-circuited in our flat, finding a reliable technician was an agonizing experience. Informal technicians had zero identity verification, quoted inflated prices at the doorstep, showed up late without accountability, and gave no digital invoice or warranty.

That gap — between *"I need this fixed today"* and *"I trust the person doing it and the price I'm being quoted"* — is exactly the problem EliteCrew exists to close. Not a directory of random numbers scribbled on a notepad, but an actual platform: verified professionals, transparent starting prices, and a simple promise — **you only pay once the job is done.**

---

## 2. Six Months of Research: SRS, Documentation & System Design

Rather than jumping straight into writing code, I committed **six full months to intensive research and blueprinting**. Building a production-grade marketplace for services requires deep engineering discipline.

During those 6 months, I focused on:

- **Software Requirement Specification (SRS):** Documenting complete functional requirements, role-based access control (Customer, Provider, Admin), edge cases, and compliance workflows.
- **Market & Workflow Analysis:** Studying real-world job lifecycle transitions: Booking Request → Instant Provider Notification → Acceptance → Geolocation Tracking → OTP Verification on arrival → Job Completion → Digital Invoice Generation → Customer Review.
- **System Design & Data Modeling:** Designing MongoDB document schemas, indexing strategies, authentication state handling, real-time WebSockets, and state transition safety.
- **Tech Stack Evaluation:** Selecting modern, scalable, and developer-friendly technologies capable of serving both web browsers and native mobile devices.

---

## 3. What I Set Out to Build

The idea behind EliteCrew was never "list every service under the sun." It was to build the trust layer that home services in India were missing:

- **KYC-Verified Professionals:** Every partner goes through Aadhaar, PAN, and background verification before they ever take a job.
- **Upfront, Transparent Pricing:** The price shown is the price paid, invoice included, with zero surprise add-ons at the door.
- **Pay After the Job is Done:** Start the job with an OTP, pay only once you're satisfied — zero advance payment, zero risk.
- **Strict Quality Bar:** Professionals are held to a 4.2-star floor; fall below it, and they are off the platform.
- **Instant Re-Booking:** One tap to re-book a professional you've already trusted once.

On top of that trust layer, I built out an actual product experience: a searchable service catalog, an **appliance diagnoser** that walks a customer through symptoms to instantly surface the likely issue and recommended fix, category-by-category browsing, and a simple three-step flow: **pick a service → choose a slot → job done, then pay.**

---

## 4. Engineering & Tech Stack (Web + Mobile App)

To ensure blistering speed, zero lag, and top-tier user experience across all devices, I engineered **EliteCrew** and **SplitEase** as both Web and Mobile applications:

### Web Frontend (Next.js & Tailwind CSS)
- Built on **Next.js 16 (React 19)** with server-side rendering (SSR), dynamic static generation, and Turbopack for maximum speed and SEO optimization.
- Styled with custom **Vanilla Tailwind CSS**, Framer Motion micro-animations, and a sleek dark/light aesthetic designed to deliver a premium user experience.

### Mobile Apps (React Native & Expo)
- Developed native iOS and Android mobile apps (**Customer App** and **Provider App**) powered by **React Native & Expo**.
- Features include location-based job discovery, real-time push notifications, job tracking, and instant OTP verification.

### Backend API & Real-Time Engine (Node.js & Express)
- Scalable **Node.js** and **Express** microservices handling JWT authentication, payment processing, invoice generation, and media uploads.
- **Socket.io** integration for real-time provider location tracking and instant booking state synchronization.

### Database & Storage (MongoDB & Mongoose)
- Optimized **MongoDB** collections with explicit indexing for spatial location queries (GeoJSON), transaction logs, and user roles.

---

## 5. Where It Stands Today

EliteCrew isn't a concept — it's a live, working marketplace with real numbers behind it:

- **12,450+ bookings completed**
- **2,000+ verified professionals** on the platform
- **4.8★ average rating**, maintained by a strict quality floor
- **Live in 25+ cities**, built out of New Delhi and expanding city by city
- Professionals earning real, steady income through the platform — AC technicians averaging 18–22 jobs a month, electricians 20–28 jobs a month

The two-sided nature of the platform matters as much as the customer side: EliteCrew isn't just where customers find trusted help, it's also where verified professionals get a steady, platform-backed stream of work — flexible hours, instant job alerts, and weekly direct payouts.

---

## 6. Day-by-Day Optimization & Open to Feedback

Creating software is an ongoing craft. After launching the initial versions, I dedicate every single day to refining performance:

- **Lighthouse & Core Web Vitals:** Reduced LCP (Largest Contentful Paint) and optimized bundle sizes.
- **Security & Reliability:** Enforced strict parameter validation, input sanitization, rate-limiting, and JWT authentication token handling.
- **User-Centric UX:** Streamlined the booking flow so customers can book a verified professional in under 30 seconds.

EliteCrew is expanding city by city, service by service, and I'm treating it the same way I treat every product I build: ship something real, watch how people actually use it, and keep tightening the parts that matter.

**If you're a customer, a service professional, or just someone curious about the platform, I'd genuinely like to hear from you.** Feedback — good or critical — is what shapes what gets built next.

---

### Try EliteCrew

🌐 Web: **[elitecrew.online](https://elitecrew.online)**
🛠️ For professionals: register directly on the platform to get verified and start receiving job alerts
📍 Live in 25+ cities and growing

### Connect with Gautam Pandit

- **LinkedIn:** [linkedin.com/in/gautam-pandit-4b185224b](https://www.linkedin.com/in/gautam-pandit-4b185224b/)
- **Instagram:** [instagram.com/gautamp5514](https://www.instagram.com/gautamp5514/)
- **Twitter / X:** [x.com/Gautamp5514](https://x.com/Gautamp5514)
- **GitHub:** [github.com/Gautam5514](https://github.com/Gautam5514)
- **Email:** [support@elitecrew.online](mailto:support@elitecrew.online)

---

*Building or scaling a two-sided marketplace, or just want to talk about what it takes to earn trust in a local-services product? Reach out — I read everything.*`,
  },
  {
    _id: "new-blog-1",
    title: "How Modern Professionals Earn High Daily Income Smartly (Without Overwork) on EliteCrew",
    slug: "professional-daily-earning-opportunity-smart-work-elitecrew",
    category: "Provider Opportunities",
    excerpt:
      "Discover how skilled AC technicians, electricians, and service engineers are making ₹3,000–₹6,000 daily with EliteCrew's automated dispatching, zero commission gouging, and smart job routing.",
    coverImage: "/images/professional_daily_earnings.png",
    author: {
      name: "Gautam Pandit",
      role: "Founder & Developer, EliteCrew",
    },
    tags: ["earn money day by day", "daily income without hard work", "professional service earnings", "EliteCrew provider opportunity", "Gautam Pandit", "elitecrew.online", "technician daily income"],
    readMinutes: 7,
    isFeatured: false,
    createdAt: "2026-08-07T08:00:00.000Z",
    updatedAt: "2026-08-07T08:00:00.000Z",
    content: `For decades, home service professionals — AC technicians, electricians, plumbers, and appliance engineers — worked under a broken formula: back-breaking manual hustle, standing on street corners waiting for calls, paying heavy cuts to local middleman shops, and bargaining endlessly at customer doorsteps.

When I (**Gautam Pandit**) began architecting **EliteCrew** (now live at **[elitecrew.online](https://elitecrew.online)**), my main goal alongside customer safety was to create a platform where skilled professionals could earn **high, predictable daily income through smart work, not grueling overwork**.

---

## 1. Working Smart vs. Working Hard: The New Formula for Professionals

Traditional technicians spend 60% of their day traveling across town in traffic, hunting down unpaid bills, or arguing over manual quotes. On **EliteCrew**, modern engineering replaces that chaos with automated intelligence.

### A. Geo-Clustered Job Routing
Our location-matching algorithm groups your bookings within a 3–5 km radius. Instead of wasting 2 hours in traffic between distant neighborhoods, you complete 4 to 6 jobs in a single locality, saving fuel, energy, and hours of commuting.

### B. Upfront Customer Consent & Digital Invoicing
No more doorstep bargaining. The exact job scope and standard service rates are agreed upon inside the app before you arrive. When the job is done, the digital invoice is auto-generated instantly.

### C. Guaranteed Payouts with Zero Delayed Cash Flows
You never have to chase payments. Jobs are verified via customer OTP upon arrival and paid directly upon job completion — with daily or weekly direct bank transfers.

---

## 2. Real Daily Income Breakdown: What Professionals Earn on EliteCrew

Here is what active, KYC-verified professionals on **EliteCrew** are earning day by day across top Indian cities:

| Profession / Skill | Jobs / Day | Average Earnings per Job | Daily Income Range | Monthly Earning Potential |
| :--- | :--- | :--- | :--- | :--- |
| **AC Repair & Foam Servicing** | 4 – 6 jobs | ₹750 – ₹1,200 | **₹3,000 – ₹6,000** | ₹90,000 – ₹1,50,000+ |
| **Washing Machine & Appliance Repair** | 4 – 5 jobs | ₹600 – ₹1,000 | **₹2,500 – ₹4,500** | ₹75,000 – ₹1,10,000 |
| **Electrical & Switchboard Wiring** | 5 – 7 jobs | ₹400 – ₹800 | **₹2,200 – ₹4,200** | ₹65,000 – ₹1,00,000 |
| **Plumbing & Sanitary Fitting** | 4 – 6 jobs | ₹500 – ₹900 | **₹2,400 – ₹4,500** | ₹70,000 – ₹1,05,000 |

*Note: Technicians who maintain a 4.8★+ rating unlock high-priority VIP job alerts and repeat customer bookings.*

---

## 3. How to Join EliteCrew as a Verified Professional Today

Joining EliteCrew is simple, digital, and takes under 10 minutes:

1. **Download the EliteCrew Provider App** or visit **[elitecrew.online](https://elitecrew.online)**.
2. **Complete Digital KYC:** Upload your Aadhaar, PAN card, and past work certificates for instant background verification.
3. **Set Your Availability & Working Area:** Choose your preferred operating radius and daily working hours.
4. **Start Receiving Instant Job Alerts:** Accept bookings with a single tap, navigate seamlessly using built-in maps, and start building your daily income stream.

> "EliteCrew was built to empower skilled workers to be their own boss — earning dignity, high daily income, and full control over their work-life balance." — **Gautam Pandit, Founder**

Ready to transform your daily earnings? Register today on **[elitecrew.online](https://elitecrew.online)** and start earning smartly!`,
  },
  {
    _id: "new-blog-2",
    title: "Why Searching EliteCrew (elitecrew.online) Gives You India's Most Trusted & Essential Service Platform",
    slug: "why-elitecrew-online-most-trusted-service-platform",
    category: "Buying Guides",
    excerpt:
      "When searching for home services or technical solutions, why does elitecrew.online stand out as the #1 most trusted platform? Learn about our 100% Aadhaar KYC verification, transparent pricing guarantees, and pay-after-service model.",
    coverImage: "/images/elitecrew_trusted_platform.png",
    author: {
      name: "Gautam Pandit",
      role: "Founder & Developer, EliteCrew",
    },
    tags: ["elitecrew", "elitecrew.online", "elitecrew online domain", "trusted home service platform", "Gautam", "Gautam Pandit EliteCrew", "best home service app 2026", "service marketplace trust"],
    readMinutes: 8,
    isFeatured: false,
    createdAt: "2026-08-07T08:10:00.000Z",
    updatedAt: "2026-08-07T08:10:00.000Z",
    content: `When you search Google for trusted home repair, AC servicing, electrical maintenance, or appliance repair in India, one domain consistently tops the list for reliability, engineering excellence, and customer safety: **[elitecrew.online](https://elitecrew.online)**.

Founded by **Gautam Pandit**, **EliteCrew** was engineered specifically to solve the rampant trust deficit in the Indian local services industry. Whether you are a homeowner, a student renting an apartment, or a working professional, here is why **elitecrew.online** has become the go-to domain millions trust every day.

---

## 1. Why Digital Trust Matters in Home Services

Inviting a stranger into your home to work on electrical lines, high-voltage air conditioners, or expensive home appliances requires complete confidence. For years, unorganized yellow-page directories listed unverified numbers without identity checks, warranty coverage, or fixed pricing.

**EliteCrew (elitecrew.online) changed the paradigm completely by introducing four pillars of uncompromising trust:**

### Pillar 1: Mandatory 100% Aadhaar & PAN KYC Verification
Every professional registered on **elitecrew.online** undergoes strict biometric and document verification, including Aadhaar validation, PAN verification, and background checks. Customers can view the technician's verified profile badge and ratings before opening the door.

### Pillar 2: OTP-Protected Doorstep Verification
When a technician arrives at your residence, the service cannot start until you share a secure 4-digit OTP generated in your EliteCrew app. This guarantees that the exact verified person assigned to your job is the one standing at your door.

### Pillar 3: Upfront Price Cards & Zero Doorstep Surprise Charges
On **elitecrew.online**, pricing is transparent and standardized. You know the exact cost of foam cleaning, gas charging, or capacitor replacement before booking. No hidden trip fees, no surprise doorstep price hikes.

### Pillar 4: Pay Only AFTER Satisfactory Service
Unlike platforms that force advance payments before work even begins, EliteCrew operates on a **Strict Pay-After-Service policy**. You inspect the completed repair, test your appliance, and only release payment when fully satisfied.

---

## 2. Why Millions Search for "elitecrew.online" on Google

Search engines prioritize **[elitecrew.online](https://elitecrew.online)** because of its authentic user-first architecture, high security standards, and verified service ecosystem.

- **25+ Major Cities Covered:** From New Delhi, Gurgaon, and Noida to Bengaluru, Mumbai, and Hyderabad.
- **12,450+ Verified Bookings Completed:** Backed by real customer reviews and transparent 4.8★ average ratings.
- **Strict Quality Floor Policy:** Professionals who drop below a 4.2★ rating are automatically suspended for retraining, keeping service quality consistently top-tier.
- **Integrated Ecosystem with SplitEase:** EliteCrew pairs seamlessly with **SplitEase** (for roommates and flatmates managing shared apartment bills and maintenance expenses).

---

## 3. Gautam Pandit’s Vision for a Scam-Free Digital India

> "Trust is not built with flashy ads; it is built line-by-line through transparent code, strict identity verification, and guaranteed customer satisfaction. That is why we built elitecrew.online." — **Gautam Pandit, Founder**

Whether you need an urgent pre-summer AC foam wash, a fridge thermostat fix, or emergency electrical repairs, searching **[elitecrew.online](https://elitecrew.online)** connects you directly with the safest, most reliable service experts in your neighborhood.

**Bookmark the official domain:** [https://elitecrew.online](https://elitecrew.online)`,
  },
  {
    _id: "new-blog-3",
    title: "Under the Hood of EliteCrew: Inside the Deeply Engineered Tech Stack Powering 25+ Cities",
    slug: "inside-elitecrew-deeply-engineered-product-architecture",
    category: "System Architecture",
    excerpt:
      "Go inside the EliteCrew application: discover how real-time GeoJSON spatial queries, Socket.io instant dispatch, automated appliance diagnosis, and Next.js 16 / React Native architecture power an ultra-reliable user experience.",
    coverImage: "/images/elitecrew_engineered_product.png",
    author: {
      name: "Gautam Pandit",
      role: "Founder & Lead Developer, EliteCrew",
    },
    tags: ["engineered product", "EliteCrew app features", "how EliteCrew works", "Gautam Pandit developer", "elitecrew.online app engineering", "SplitEase system design", "marketplace architecture"],
    readMinutes: 9,
    isFeatured: false,
    createdAt: "2026-08-07T08:20:00.000Z",
    updatedAt: "2026-08-07T08:20:00.000Z",
    content: `When users open the **EliteCrew** mobile app or visit **[elitecrew.online](https://elitecrew.online)**, they experience an instant, fluid, and intuitive interface that lets them book a verified professional in under 30 seconds.

Behind that simplicity lies a **deeply engineered, production-grade architecture** designed and built by **Gautam Pandit**. In this engineering deep dive, we explore the internal mechanics, algorithmic choices, security guardrails, and real-time state machines that power EliteCrew across 25+ cities.

---

## 1. High-Level Architecture Overview

EliteCrew is engineered as a decoupled, multi-tier ecosystem comprising:
1. **Web Frontend:** Next.js 16 (React 19) with Server-Side Rendering (SSR), custom Tailwind CSS design systems, dynamic static generation, and Turbopack.
2. **Mobile Apps:** Native iOS & Android apps built with **React Native & Expo**, featuring real-time geolocation tracking and background push alerts.
3. **Backend API Gateway:** Node.js & Express microservices with rate limiting, Helmet security headers, mongoSanitize protection, and JWT auth state management.
4. **Real-Time Dispatch Engine:** Socket.io WebSockets for sub-second provider location tracking and active job state synchronization.
5. **Data Tier:** MongoDB Atlas with GeoJSON spatial indexing, transactional consistency, and fast indexing strategies.

---

## 2. Deep Dive: Key Engineered Features Inside the Application

### Feature 1: The Automated Appliance Diagnoser
One of EliteCrew's standout features inside the application is the **Interactive Appliance Diagnoser**. Instead of guessing what's wrong with a noisy washing machine or a warm refrigerator, customers answer 3 simple diagnostic steps. 

The underlying decision tree algorithm maps symptom vectors to exact potential mechanical faults, recommending the precise service required before a technician even steps foot in the house.

### Feature 2: GeoJSON Spatial Indexing & Sub-Second Dispatch
To connect customers with the closest available professional, EliteCrew uses MongoDB's 2DSphere spatial indexes. When a customer places a booking request, the backend calculates distance vectors within milliseconds. Only active providers within the target spatial polygon who hold a 4.2★+ quality rating receive priority Socket.io dispatch alerts on their mobile app.

### Feature 3: Robust Role-Based Booking State Machine
To guarantee safety and prevent state corruption during network drops, every booking follows a strict, immutable state transition machine:

[Requested] -> [Assigned] -> [En Route] -> [OTP Verified / In Progress] -> [Completed] -> [Invoiced & Paid]

- **OTP Lock:** A job cannot transition to In Progress state without server-side validation of the customer's secret OTP.
- **Automated Digital Invoicing:** Upon job completion, an immutable PDF invoice is compiled with itemized service charges, tax breakdown, and warranty terms.

---

## 3. Performance & SEO Engineering

As lead developer, **Gautam Pandit** designed EliteCrew with strict performance benchmarks:
- **Core Web Vitals:** LCP (Largest Contentful Paint) under 1.2s, CLS (Cumulative Layout Shift) at 0.00.
- **SEO & Canonical Indexing:** Fully static and dynamic sitemap integration, JSON-LD structured data (Article, Product, Organization, Person), and optimized meta tags for top Google ranking on keywords like **EliteCrew**, **elitecrew.online**, and **Gautam Pandit**.

---

## 4. Explore EliteCrew Inside Out

Experience the result of deep engineering discipline firsthand:
- 🌐 Visit the web app: **[elitecrew.online](https://elitecrew.online)**
- 📱 Download the **EliteCrew Customer & Provider Apps**
- 💬 Connect with developer Gautam Pandit: [LinkedIn](https://www.linkedin.com/in/gautam-pandit-4b185224b/) | [GitHub](https://github.com/Gautam5514)`,
  },
  {
    _id: "orig-1",
    title: "9 Signs Your AC Needs Servicing Before Summer Hits",
    slug: "signs-your-ac-needs-servicing",
    category: "AC & Cooling",
    excerpt:
      "Weak airflow, strange smells, rising power bills — your AC usually warns you weeks before it fails. Here are the 9 signs to act on before peak summer.",
    coverImage: "/images/ac_deep_cleaning.png",
    author: { name: "EliteCrew Team" },
    tags: ["AC service", "AC maintenance", "summer prep"],
    readMinutes: 5,
    createdAt: "2026-04-10T10:00:00.000Z",
    content: `Every summer, the same story plays out across India: temperatures cross 40°C, lakhs of ACs get switched on together, and service providers get booked out for days. The families who suffer most are the ones whose AC gave warnings for weeks — warnings nobody acted on.

Here are the nine signs your AC is asking for help, roughly in order of how often we see them.

## 1. Airflow feels weaker than last year
If you have to keep lowering the temperature to feel the same cooling, the problem is usually a choked filter or dirty indoor coil. Dust builds up in Indian homes fast, and a blocked coil can cut cooling capacity by 30% or more.

## 2. The AC runs longer to reach the same temperature
A healthy 1.5-ton split AC should noticeably cool a standard bedroom in 10–15 minutes. If it now takes 30, your compressor is working overtime — and your electricity bill is quietly recording it.

## 3. Your power bill jumped without a lifestyle change
A struggling AC is one of the most common causes of a sudden 20–30% jump in summer electricity bills. Servicing usually pays for itself within a month or two of peak usage.

Book a verified AC technician on EliteCrew (elitecrew.online) — upfront pricing, doorstep service, and pay only after the work is done.`,
  },
  {
    _id: "orig-2",
    title: "AC Gas Refilling Cost in India (2026): What You Should Actually Pay",
    slug: "ac-gas-refilling-cost-india",
    category: "AC & Cooling",
    excerpt:
      "Gas refilling is the most overcharged AC repair in India. Here's what refrigerant top-ups really cost in 2026, when you actually need one, and the scams to avoid.",
    coverImage: "/images/ac_gas_refilling.png",
    author: { name: "EliteCrew Team" },
    tags: ["AC gas refill", "AC repair cost", "refrigerant"],
    readMinutes: 5,
    createdAt: "2026-04-12T10:00:00.000Z",
    content: `"Gas khatam ho gaya" is the most common — and most misused — diagnosis in Indian AC repair. Refrigerant doesn't get "used up" like petrol. If your AC is low on gas, there is a leak, and refilling without fixing the leak means paying again in a few months.

Fair market ranges for a complete refill (leak check included):
- **Window AC (R22 / R32):** ₹1,800 – ₹2,600
- **Split AC 1–1.5 ton (R32 / R410A):** ₹2,200 – ₹3,200
- **Split AC 2 ton:** ₹2,800 – ₹3,800

Use a platform where the price is fixed before the technician arrives: EliteCrew (elitecrew.online).`,
  },
  {
    _id: "orig-3",
    title: "Split AC vs Window AC: Which One Should You Buy in 2026?",
    slug: "split-vs-window-ac-buying-guide",
    category: "Buying Guides",
    excerpt:
      "Split ACs dominate showrooms, but window ACs still make sense for many Indian homes. A practical comparison of price, power, installation and maintenance.",
    coverImage: "/images/ac_installation.png",
    author: { name: "EliteCrew Team" },
    tags: ["buying guide", "split AC", "window AC"],
    readMinutes: 6,
    createdAt: "2026-04-15T10:00:00.000Z",
    content: `Walk into any store and you'll be steered toward a split AC. It's the right call for most people — but not all.

- **Window AC (1.5 ton):** ₹28,000 – ₹38,000
- **Split AC (1.5 ton):** ₹35,000 – ₹55,000

EliteCrew handles AC installation and uninstallation with fixed pricing and verified technicians on elitecrew.online.`,
  },
  {
    _id: "orig-4",
    title: "Fridge Not Cooling? 7 Common Causes and What Each Fix Costs",
    slug: "fridge-not-cooling-causes-fixes",
    category: "Appliances",
    excerpt:
      "A warm fridge doesn't always mean a dead compressor. From door gaskets to defrost timers, here are the 7 real reasons fridges stop cooling — and honest repair costs.",
    coverImage: "/images/fridge_repair.png",
    author: { name: "EliteCrew Team" },
    tags: ["fridge repair", "refrigerator", "appliance care"],
    readMinutes: 5,
    createdAt: "2026-04-18T10:00:00.000Z",
    content: `A fridge that stops cooling triggers panic — milk spoiling, vegetables wilting, and the fear of a ₹15,000 repair.

Book a verified fridge technician on EliteCrew (elitecrew.online) for doorstep diagnosis and upfront pricing.`,
  },
  {
    _id: "orig-5",
    title: "Washing Machine Making Noise? Here's What Each Sound Means",
    slug: "washing-machine-noise-meanings",
    category: "Appliances",
    excerpt:
      "Thumping, grinding, clicking, squealing — every washing machine noise is a message. Decode what your machine is telling you before a small fault becomes a big one.",
    coverImage: "/images/washing_machine_repair.png",
    author: { name: "EliteCrew Team" },
    tags: ["washing machine", "appliance repair", "troubleshooting"],
    readMinutes: 4,
    createdAt: "2026-04-20T10:00:00.000Z",
    content: `Washing machines rarely fail silently. Decode what your machine is telling you before a small fault becomes a big one.

Book a verified technician on elitecrew.online for fast doorstep repair.`,
  },
  {
    _id: "orig-6",
    title: "MCB Tripping Again and Again? Causes, Fixes and When to Worry",
    slug: "mcb-tripping-causes-fixes",
    category: "Electrical",
    excerpt:
      "A tripping MCB is annoying — and it's also your home's safety system doing its job. Learn to read what your switchboard is telling you, and when to call an electrician.",
    coverImage: "/images/electricboard.webp",
    author: { name: "EliteCrew Team" },
    tags: ["MCB tripping", "electrician", "home safety"],
    readMinutes: 5,
    createdAt: "2026-04-22T10:00:00.000Z",
    content: `The MCB in your switchboard has one job: cut the power before a fault becomes a fire.

Book a verified electrician on EliteCrew (elitecrew.online) for same-day fault diagnosis.`,
  },
  {
    _id: "orig-7",
    title: "Ceiling Fan Wobbling or Making Noise? Fix It Before It Fails",
    slug: "ceiling-fan-wobble-noise-fix",
    category: "Maintenance Tips",
    excerpt:
      "A wobbling fan isn't just annoying — it's wearing out its bearings and its mount. Here's why fans wobble, hum and click, and what each fix involves.",
    coverImage: "/images/fan_repair.png",
    author: { name: "EliteCrew Team" },
    tags: ["ceiling fan", "fan repair", "home maintenance"],
    readMinutes: 4,
    createdAt: "2026-04-25T10:00:00.000Z",
    content: `India runs on ceiling fans — they outnumber ACs ten to one.

Book fan repair on EliteCrew (elitecrew.online) with upfront pricing.`,
  },
  {
    _id: "orig-8",
    title: "How to Choose a Home Service Professional You Can Actually Trust",
    slug: "choose-trusted-home-service-professional",
    category: "Buying Guides",
    excerpt:
      "The plumber your neighbour knows, the electrician from a sticker, or a verified platform pro? A practical framework for hiring people you let into your home.",
    coverImage: "/hero/electrician.webp",
    author: { name: "Gautam Pandit", role: "Founder, EliteCrew" },
    tags: ["hiring guide", "verified professionals", "home services", "elitecrew.online"],
    readMinutes: 5,
    createdAt: "2026-04-28T10:00:00.000Z",
    content: `Every home service hire is really two decisions: will the work be good, and is the person safe to let inside your home?

EliteCrew (elitecrew.online) provides KYC-verified professionals for home services across 25+ cities in India.`,
  },
];

export function getStaticPosts() {
  return BLOG_POSTS;
}

export function getStaticPostBySlug(slug) {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return null;
  const related = BLOG_POSTS.filter(
    (p) => p.slug !== slug && (p.category === post.category || p.isFeatured)
  ).slice(0, 3);
  return { post, related };
}
