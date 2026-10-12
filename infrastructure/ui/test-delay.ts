export async function waitForUiTestDelay() {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.FOGONS_UI_DELAY !== "1"
  )
    return;
  await new Promise((resolve) => setTimeout(resolve, 700));
}
