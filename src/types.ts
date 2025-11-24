import { z } from 'zod';

// Google Analytics Data API Types
export const DateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  name: z.string().optional(),
});

export const DimensionSchema = z.object({
  name: z.string(),
});

export const MetricSchema = z.object({
  name: z.string(),
});

export const OrderBySchema = z.object({
  dimension: z.object({ dimensionName: z.string() }).optional(),
  metric: z.object({ metricName: z.string() }).optional(),
  desc: z.boolean().optional(),
});

export const FilterExpressionSchema = z.object({
  andGroup: z.any().optional(),
  orGroup: z.any().optional(),
  notExpression: z.any().optional(),
  filter: z.any().optional(),
});

export const RunReportRequestSchema = z.object({
  dateRanges: z.array(DateRangeSchema),
  dimensions: z.array(DimensionSchema).optional(),
  metrics: z.array(MetricSchema),
  dimensionFilter: FilterExpressionSchema.optional(),
  metricFilter: FilterExpressionSchema.optional(),
  offset: z.number().optional(),
  limit: z.number().optional(),
  metricAggregations: z.array(z.string()).optional(),
  orderBys: z.array(OrderBySchema).optional(),
  currencyCode: z.string().optional(),
  keepEmptyRows: z.boolean().optional(),
});

export const PivotSchema = z.object({
  fieldNames: z.array(z.string()),
  limit: z.number().optional(),
  orderBys: z.array(OrderBySchema).optional(),
});

export const RunPivotReportRequestSchema = z.object({
  dateRanges: z.array(DateRangeSchema),
  dimensions: z.array(DimensionSchema).optional(),
  metrics: z.array(MetricSchema),
  pivots: z.array(PivotSchema),
  dimensionFilter: FilterExpressionSchema.optional(),
  metricFilter: FilterExpressionSchema.optional(),
  currencyCode: z.string().optional(),
});

export const FunnelStepSchema = z.object({
  name: z.string(),
  isDirectlyFollowedBy: z.boolean().optional(),
  withinDurationFromPriorStep: z.string().optional(),
  filterExpression: FilterExpressionSchema.optional(),
});

export const RunFunnelReportRequestSchema = z.object({
  dateRanges: z.array(DateRangeSchema),
  funnelBreakdown: DimensionSchema.optional(),
  funnelSteps: z.array(FunnelStepSchema),
  funnelVisualizationType: z.enum(['STANDARD_FUNNEL', 'TRENDED_FUNNEL']).optional(),
});

// Measurement Protocol Types
export const EventParameterSchema = z.object({
  name: z.string(),
  value: z.union([z.string(), z.number()]),
});

export const UserPropertySchema = z.object({
  name: z.string(),
  value: z.string(),
});

export const EventSchema = z.object({
  name: z.string(),
  params: z.record(z.any()).optional(),
});

export const MeasurementProtocolEventSchema = z.object({
  client_id: z.string().optional(),
  user_id: z.string().optional(),
  timestamp_micros: z.number().optional(),
  user_properties: z.record(z.object({ value: z.union([z.string(), z.number()]) })).optional(),
  events: z.array(EventSchema),
  non_personalized_ads: z.boolean().optional(),
});

export const EcommerceItemSchema = z.object({
  item_id: z.string().optional(),
  item_name: z.string().optional(),
  affiliation: z.string().optional(),
  coupon: z.string().optional(),
  currency: z.string().optional(),
  discount: z.number().optional(),
  index: z.number().optional(),
  item_brand: z.string().optional(),
  item_category: z.string().optional(),
  item_category2: z.string().optional(),
  item_category3: z.string().optional(),
  item_category4: z.string().optional(),
  item_category5: z.string().optional(),
  item_list_id: z.string().optional(),
  item_list_name: z.string().optional(),
  item_variant: z.string().optional(),
  location_id: z.string().optional(),
  price: z.number().optional(),
  quantity: z.number().optional(),
});

// Export types
export type DateRange = z.infer<typeof DateRangeSchema>;
export type Dimension = z.infer<typeof DimensionSchema>;
export type Metric = z.infer<typeof MetricSchema>;
export type OrderBy = z.infer<typeof OrderBySchema>;
export type FilterExpression = z.infer<typeof FilterExpressionSchema>;
export type RunReportRequest = z.infer<typeof RunReportRequestSchema>;
export type RunPivotReportRequest = z.infer<typeof RunPivotReportRequestSchema>;
export type FunnelStep = z.infer<typeof FunnelStepSchema>;
export type RunFunnelReportRequest = z.infer<typeof RunFunnelReportRequestSchema>;
export type EventParameter = z.infer<typeof EventParameterSchema>;
export type UserProperty = z.infer<typeof UserPropertySchema>;
export type Event = z.infer<typeof EventSchema>;
export type MeasurementProtocolEvent = z.infer<typeof MeasurementProtocolEventSchema>;
export type EcommerceItem = z.infer<typeof EcommerceItemSchema>;

export interface GAConfig {
  serviceAccountJson?: string;
  propertyId?: string;
  measurementId?: string;
  apiSecret?: string;
}
