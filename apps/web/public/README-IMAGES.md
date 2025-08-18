# TypeB Web App Image Assets

## Hero Image
The user has provided a new hero image for the landing page. This image should be saved as:
- **Location**: `/public/hero-image.jpg`
- **Purpose**: Main hero section background/featured image
- **Description**: Shows a person (likely a parent) using a smartphone, fitting the family task management theme

## Logo Files
- **TypeB Logo**: `/public/type_b_logo.png` - Main TypeB logo with stylized "B"
- **Favicon**: `/public/favicon.png` - Same as TypeB logo, used as browser favicon

## Required Actions
1. Save the actual hero image provided by the user to `/public/hero-image.jpg`
2. Optimize the image for web (recommended: max 1920px width, compressed for web)
3. Consider creating additional sizes for responsive design:
   - hero-image-mobile.jpg (max 768px width)
   - hero-image-tablet.jpg (max 1024px width)

## Color Palette (from TypeB brand)
- Primary Purple: `#8B5CF6`
- Primary Pink: `#EC4899`
- Primary Indigo: `#6366F1`
- Gradient: `from-purple-600 via-pink-600 to-indigo-600`

## Image Optimization Tips
```bash
# Using ImageMagick to optimize:
convert hero-image.jpg -resize 1920x -quality 85 hero-image-optimized.jpg

# Using next/image optimization (already configured in code)
# Images are automatically optimized when served
```
