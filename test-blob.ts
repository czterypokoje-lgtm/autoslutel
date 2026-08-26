import { put } from '@vercel/blob';

async function testUpload() {
  try {
    const token = "vercel_blob_rw_uJjvXzJMAotRzFCL_dGtyRiJ38jIBBuYrwcUk88oXYDsHwj";
    console.log("Uploading with token...");
    const blob = await put('test.txt', 'Hello, world!', {
      access: 'public',
      token: token,
    });
    console.log("Upload successful:", blob);
  } catch (error) {
    console.error("Upload failed:", error);
  }
}

testUpload();
