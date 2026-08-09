export interface AwsResponse {
  statusCode: number;
  body: string;
  headers: unknown;
  isBase64Encoded?: boolean;
}
