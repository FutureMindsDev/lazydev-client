/**
 * Copyright (c) 2026 FutureMindsDev. All rights reserved.
 *
 * LazyDev™ is a trademark of FutureMindsDev.
 * Organization : https://github.com/FutureMindsDev
 *
 * Authors:
 *   Arkar Chan Myae  <https://github.com/arkar-chanmyae>
 *   Khin Me Me Latt  <https://github.com/KhinMeMeLatt>
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the browser preview (127.0.0.1) to load dev resources from the
  // dev server bound to localhost. Production is unaffected.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
