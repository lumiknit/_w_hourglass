// Request accelerometer permission

export const permissionRequired = () => {
  return (
    "DeviceMotionEvent" in window &&
    typeof (window.DeviceMotionEvent as any).requestPermission === "function"
  );
};

export const requestPermission = async () => {
  if (!permissionRequired()) return true;
  try {
    await (window.DeviceMotionEvent as any).requestPermission();
    return true;
  } catch (error) {
    return false;
  }
};
