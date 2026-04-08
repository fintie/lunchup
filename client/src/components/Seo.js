import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_TITLE = 'Lunchup, startup networking and founder connections in Australia';
const DEFAULT_DESCRIPTION = 'Lunchup helps founders, operators, and startup people in Australia discover relevant connections, follow startup news, and build better professional relationships.';
const SITE_URL = 'https://lunchup.com.au';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

const buildCanonicalUrl = (path = '/') => {
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalisedPath}`;
};

const Seo = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  keywords = []
}) => {
  const canonical = buildCanonicalUrl(path);
  const keywordContent = keywords.filter(Boolean).join(', ');

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywordContent ? <meta name="keywords" content={keywordContent} /> : null}
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="Lunchup" />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default Seo;
