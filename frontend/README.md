This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

### HTTPS Development (Recommended for QR Scanner)

For optimal QR code scanning functionality, it's recommended to run the development server with HTTPS:

```bash
npm run dev:https
# or
yarn dev:https
# or
pnpm dev:https
# or
bun dev:https
```

Open [https://localhost:3001](https://localhost:3001) with your browser to see the result.

**Note:** Your browser may show a security warning about the self-signed certificate. Click "Advanced" and "Proceed to localhost" to continue.

**QR Scanner Compatibility:** The QR scanner will work on HTTP localhost, but some browsers may require you to allow camera access for insecure contexts. For production use, HTTPS is strongly recommended.

### Troubleshooting Camera Issues

If you encounter "Camera API not supported on this device" errors:

1. **Browser Compatibility**: Use Chrome, Firefox, Safari, or Edge (latest versions)
2. **Mobile Devices**: Chrome and Safari work best on mobile
3. **Permissions**: Allow camera access when prompted
4. **HTTPS**: Use HTTPS for better compatibility
5. **Manual Entry**: If camera fails, use the "Enter Code Manually" option
6. **Browser Settings**: Enable camera access for insecure contexts if needed

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
