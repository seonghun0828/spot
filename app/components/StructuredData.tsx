export default function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Spot',
    description:
      '지금 바로(1시간 이내에) 근처에 있는 사람들과 소통하여 오프라인 만남을 시작하는 위치 기반 근거리 소통 웹 앱',
    url: 'https://spot-app.vercel.app',
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    author: {
      '@type': 'Organization',
      name: 'Spot Team',
    },
    screenshot:
      'https://github.com/seonghun0828/spot/blob/main/public/images/Spot-main-image.png?raw=true',
    softwareVersion: '1.0.0',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      ratingCount: '100',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
