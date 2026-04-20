import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_TITLE = 'LunchUp, networking app for founders and professionals in Australia';
const DEFAULT_DESCRIPTION = 'LunchUp helps founders, operators, investors, and startup professionals in Australia discover relevant connections, explore networking opportunities, and build stronger professional relationships.';
const SITE_URL = 'https://lunchup.com.au';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

const buildCanonicalUrl = (path = '/') => {
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}/#${normalisedPath === '/' ? '/' : normalisedPath}`;
};

const Seo = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  keywords = [],
  robots = 'index,follow',
  schema = null,
  imageAlt = 'LunchUp, networking and opportunities platform for professionals in Australia'
}) => {
  const canonical = buildCanonicalUrl(path);
  const keywordContent = keywords.filter(Boolean).join(', ');
  const schemaBlocks = Array.isArray(schema) ? schema.filter(Boolean) : schema ? [schema] : [];

  return (
    <Helmet>
      <html lang="en-AU" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <meta name="author" content="LunchUp" />
      <meta name="publisher" content="LunchUp" />
      <meta name="application-name" content="LunchUp" />
      <meta name="apple-mobile-web-app-title" content="LunchUp" />
      <meta name="theme-color" content="#0f172a" />
      <meta name="format-detection" content="telephone=no" />
      {keywordContent ? <meta name="keywords" content={keywordContent} /> : null}
      <link rel="canonical" href={canonical} />

      <meta property="og:locale" content="en_AU" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="LunchUp" />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={imageAlt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@LunchUpApp" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {schemaBlocks.map((item, index) => (
        <script key={`schema-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
