export default function Head() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Sparkd",
            description: "Red social y dating app para conocer gente nueva",
            applicationCategory: "SocialNetworkingApplication",
            operatingSystem: "All",
            author: {
              "@type": "Person",
              name: "Johan M. Jones Anderson y Alex Manuel Gomez Salazar",
              jobTitle: "Desarrolladores Web Full Stack",
              description: "Creador de Sparkd - Red Social y Dating App",
            },
            creator: {
              "@type": "Person",
              name: "Johan M. Jones Anderson y Alex Manuel Gomez Salazar",
            },
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "1250",
            },
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Johan M. Jones Anderson y Alex Manuel Gomez Salazar",
            jobTitle: "Desarrolladores Web Full Stack",
            description:
              "Creador de Sparkd, una innovadora red social y dating app para conocer gente nueva",
            url: "https://www.mysparkd.com",
            sameAs: ["https://www.mysparkd.com"],
            knowsAbout: [
              "Desarrollo Web",
              "React",
              "Next.js",
              "TypeScript",
              "Node.js",
              "Dating Apps",
              "Redes Sociales",
            ],
            alumniOf: "Universidad",
            worksFor: {
              "@type": "Organization",
              name: "Sparkd",
              url: "https://www.mysparkd.com",
            },
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Sparkd",
            operatingSystem: "Web, iOS, Android",
            applicationCategory: "SocialNetworkingApplication",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "1250",
            },
          }),
        }}
      />
    </>
  )
}

