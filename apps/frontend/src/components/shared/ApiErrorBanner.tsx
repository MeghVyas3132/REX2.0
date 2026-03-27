type ApiErrorBannerProps = {
  message: string;
};

export function ApiErrorBanner({ message }: ApiErrorBannerProps) {
  return <div className="error-banner">{message}</div>;
}
