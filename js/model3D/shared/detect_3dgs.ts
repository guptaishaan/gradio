import type { FileData } from "@gradio/client";

/**
 * Determines whether a file should be rendered with the Gaussian Splat
 * renderer (Canvas3DGS / gsplat) or the standard 3D renderer (Canvas3D /
 * BabylonJS).
 *
 * .splat files are always Gaussian Splat format.
 * .ply files may be either Gaussian Splat or standard point cloud / mesh
 * format.  We distinguish them by fetching the first kilobyte of the file
 * and checking the ASCII header for Gaussian Splat-specific property names
 * (f_dc_0, scale_0, rot_0).  Standard point cloud PLY files only have
 * properties like x, y, z, red, green, blue and will therefore be routed to
 * the BabylonJS renderer which handles them correctly.
 */
export async function detect_use_3dgs(value: FileData): Promise<boolean> {
	if (value.path.endsWith(".splat")) return true;
	if (!value.path.endsWith(".ply")) return false;

	const url = value.url;
	if (!url) return true; // URL not yet resolved; keep existing behaviour

	try {
		const response = await fetch(url, {
			headers: { Range: "bytes=0-1023" }
		});
		const text = await response.text();
		// Gaussian Splat PLY files expose spherical-harmonic coefficients
		// (f_dc_0), scale parameters (scale_0) and rotation quaternion
		// components (rot_0) as per-vertex properties.  None of these appear
		// in standard point cloud or mesh PLY files.
		return (
			text.includes("f_dc_0") ||
			text.includes("scale_0") ||
			text.includes("rot_0")
		);
	} catch {
		// If we cannot read the header (e.g. network error, CORS) fall back
		// to the previous behaviour so existing Gaussian Splat PLY files
		// continue to work.
		return true;
	}
}
