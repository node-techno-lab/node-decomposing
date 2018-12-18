export interface Configuration {
  isProduction: boolean;
  logging: {
    shortDescription: boolean;
    transports: any[];
  };
  environment: string;
}
