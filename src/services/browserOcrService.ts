import { recognize } from "tesseract.js";

export async function recognizeImageOdds(file: File): Promise<string> {
  const result = await recognize(file, "chi_sim+eng", {
    logger: () => undefined,
  });

  return result.data.text;
}
