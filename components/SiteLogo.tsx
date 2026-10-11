export default function SiteLogo({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/icon.png"
      alt="Circuit Bungalow Finder logo"
      width={size}
      height={size}
      className="shrink-0 rounded-2xl"
      style={{ width: size, height: size }}
    />
  );
}
