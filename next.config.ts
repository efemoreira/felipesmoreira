import type { NextConfig } from "next";

// NOTE: `output: "export"` gera site estático — o Next NÃO aplica headers()/redirects().
// Os headers de segurança e cache são configurados no .htaccess (Apache), gerado no
// workflow .github/workflows/publish.yml.
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
