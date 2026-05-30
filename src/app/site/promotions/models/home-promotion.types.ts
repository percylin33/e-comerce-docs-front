export type PromotionButtonAction = 'LINK' | 'COPY' | 'NONE';

export interface HomePromotionSlide {
  id: number;
  sortOrder: number;
  imageUrl: string;
  /** Si existe, el popup en móvil usa esta URL; si no, usa imageUrl. */
  imageUrlMobile?: string | null;
  title: string | null;
  description: string | null;
  badgeText: string | null;
  buttonAction: PromotionButtonAction;
  buttonLabel: string | null;
  linkUrl: string | null;
  copyText: string | null;
  openInNewTab: boolean;
}

export interface HomePromotionCampaign {
  campaignId: number;
  placement: string;
  showDelaySeconds: number;
  contentVersion: number;
  slides: HomePromotionSlide[];
}

export interface PromotionalCampaignSummaryAdmin {
  id: number;
  code: string | null;
  placement: string;
  title: string;
  active: boolean;
  priority: number;
  startsAt: string;
  endsAt: string;
  showDelaySeconds: number;
}

export interface PromotionalSlideAdmin {
  id: number | null;
  sortOrder: number;
  active: boolean;
  imageUrl: string;
  imageUrlMobile?: string | null;
  title: string | null;
  description: string | null;
  badgeText: string | null;
  buttonAction: PromotionButtonAction;
  buttonLabel: string | null;
  linkUrl: string | null;
  copyText: string | null;
  openInNewTab: boolean;
}

export interface PromotionalCampaignAdmin extends PromotionalCampaignSummaryAdmin {
  createdAt: string;
  updatedAt: string;
  slides: PromotionalSlideAdmin[];
}

export interface ApiEnvelope<T> {
  result: boolean;
  status: number;
  data: T;
  message?: string;
}

export interface PromotionalSlideImageUploadResponse {
  imageUrl: string;
  fileName?: string | null;
}
