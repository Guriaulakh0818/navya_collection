import React from 'react';

type JsonLdProps = {
  data: Record<string, any> | Array<Record<string, any>>;
};

export function JsonLd({ data }: JsonLdProps) {
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}
