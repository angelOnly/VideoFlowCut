/** How a destination is written when pointing a user at it: `Settings → Media providers`. */
export declare function destinationPath(...segments: readonly string[]): string;
/** The Settings nav item where media/API-generation credentials are entered — `settings.mediaProviders`. */
export declare const SETTINGS_MEDIA_PROVIDERS = "Media providers";
/** `Settings → Media providers` — the destination for every missing-credential error. */
export declare const SETTINGS_MEDIA_PROVIDERS_PATH: string;
/** The top-level Integrations view — `entry.navIntegrations`. NOT a Settings section. */
export declare const INTEGRATIONS = "Integrations";
/** The Integrations tab that adds/reconnects external MCP servers — `integrations.tabLabel.mcp`. */
export declare const INTEGRATIONS_MCP = "MCP";
/**
 * `Integrations → MCP` — where a user reconnects an external MCP server.
 *
 * NOT under Settings. `McpClientSection` still has a Settings render block, but
 * it lost its sidebar nav item and is now reachable there only through an
 * `initialSection` deep link, so telling a user to open "Settings → External
 * MCP" sends them somewhere they cannot navigate to.
 */
export declare const INTEGRATIONS_MCP_PATH: string;
//# sourceMappingURL=settings-nav.d.ts.map