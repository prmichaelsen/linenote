export async function delay(delay = 200) {
  return new Promise((resolve) => {
    setTimeout(resolve, delay);
  });
}