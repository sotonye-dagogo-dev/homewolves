// ─── INTERFACES ─────────────────────────────────────────────

interface FeatureFlag {
  id: string;
  enabled: boolean;
  rolloutPercentage: number;
  roles: UserRole[];
}

interface AmenityConfig {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  displayOrder: number;
}

interface PropertyTypeConfig {
  id: string;
  label: string;
  icon: string;
  category: ListingCategory;
  active: boolean;
  displayOrder: number;
}

interface TransactionStepTemplate {
  id: string;
  label: string;
  order: number;
  requiredRoles: UserRole[];
  requiresEvidence: boolean;
  active: boolean;
}

interface BrandConfig {
  logoUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
  companyName: string;
  tagline: string;
  /** Footer credit text ("Built by S.D."). Empty string hides the credit. */
  developerCreditLabel?: string;
  /** Absolute https link for the developer credit. */
  developerCreditUrl?: string;
  /**
   * Design-token key for the developer credit colour (defaults to
   * `accent`). Resolved to a theme-aware CSS variable so the credit keeps
   * its emphasis in light, dark, and high-contrast themes.
   */
  developerCreditColorToken?: string;
}

// ─── PLATFORM CONFIG CLASS ──────────────────────────────────

class PlatformConfig {
  brand: BrandConfig;
  amenities: AmenityConfig[];
  filterPills: FilterPillConfig[];
  navItems: NavItemConfig[];
  subscriptionPlans: SubscriptionPlan[];
  featureFlags: FeatureFlag[];
  notificationTemplates: NotificationTemplate[];
  propertyTypes: PropertyTypeConfig[];
  transactionStepTemplates: TransactionStepTemplate[];
}
