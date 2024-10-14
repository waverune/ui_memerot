import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <Link href="/swap">
        <a>Go to Swap Page</a>
      </Link>
    </div>
  );
}