type PlaceholderBannerProps = {
  message?: string;
};

export function PlaceholderBanner({
  message = 'Sample data — live inspection coming in a future release.',
}: PlaceholderBannerProps) {
  return (
    <div className="placeholder-banner" role="status">
      {message}
    </div>
  );
}
