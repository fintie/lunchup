# Featured Members

The public matches page for unregistered visitors reads from `data/featuredUsers.json` first, then falls back to database users where `featuredOnPublicMatches` is `true`.

Only add LinkedIn-derived names, positions, profile photos, or LinkedIn URLs for people who have explicitly agreed to be featured on LunchUp. Do not scrape LinkedIn or copy private/non-consented profile photos into this file.

Example entry:

```json
{
  "_id": "featured-1",
  "name": "Jane Smith",
  "professionalBackground": "Head of Product at ExampleCo",
  "skills": ["Product Strategy", "B2B SaaS", "Go-to-market"],
  "preferredTopics": ["Product Leadership", "Startups"],
  "preferredLocation": "Sydney - CBD",
  "preferredMeetingPoint": "Circular Quay",
  "profilePicture": "https://example.com/jane-smith.jpg",
  "linkedinUrl": "https://www.linkedin.com/in/jane-smith/",
  "bio": "Interested in product-led growth and founder/operator lunches."
}
```
