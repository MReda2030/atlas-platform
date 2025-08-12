# Asset Optimization Docker Image for Atlas Platform
FROM node:18-alpine AS optimizer

# Install optimization tools
RUN apk add --no-cache \
    imagemagick \
    webp-tools \
    gifsicle \
    optipng \
    jpegoptim

# Install Node.js optimization tools
WORKDIR /app
RUN npm install -g \
    @squoosh/cli \
    svgo \
    terser \
    cssnano-cli \
    postcss-cli

# Copy source files
COPY package*.json ./
COPY .next ./.next
COPY public ./public

# Create optimization script
RUN cat > optimize-assets.sh << 'EOF'
#!/bin/sh
set -e

echo "🚀 Starting asset optimization..."

# Create output directory
mkdir -p /app/dist

# Optimize images
echo "📸 Optimizing images..."
find ./public -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" | while read img; do
    output="/app/dist/$(basename "$img")"
    
    # Convert to WebP
    cwebp -q 80 "$img" -o "${output%.*}.webp" 2>/dev/null || echo "Failed to convert $img to WebP"
    
    # Optimize original format
    if [[ "$img" == *.jpg ]] || [[ "$img" == *.jpeg ]]; then
        jpegoptim --max=85 --strip-all --output="/app/dist/" "$img" 2>/dev/null || cp "$img" "/app/dist/"
    elif [[ "$img" == *.png ]]; then
        optipng -o2 -dir "/app/dist/" "$img" 2>/dev/null || cp "$img" "/app/dist/"
    fi
done

# Optimize SVGs
echo "🎨 Optimizing SVGs..."
find ./public -name "*.svg" | while read svg; do
    svgo "$svg" --output="/app/dist/$(basename "$svg")" 2>/dev/null || cp "$svg" "/app/dist/"
done

# Compress static assets
echo "📦 Compressing assets..."
find ./.next/static -name "*.js" -o -name "*.css" | while read asset; do
    output_dir="/app/dist/static/$(dirname "${asset#./.next/static/}")"
    mkdir -p "$output_dir"
    
    if [[ "$asset" == *.js ]]; then
        # Minify JavaScript
        terser "$asset" --compress --mangle --output="$output_dir/$(basename "$asset")" 2>/dev/null || cp "$asset" "$output_dir/"
        
        # Create gzipped version
        gzip -9 -c "$output_dir/$(basename "$asset")" > "$output_dir/$(basename "$asset").gz"
    elif [[ "$asset" == *.css ]]; then
        # Minify CSS
        cssnano "$asset" "$output_dir/$(basename "$asset")" 2>/dev/null || cp "$asset" "$output_dir/"
        
        # Create gzipped version
        gzip -9 -c "$output_dir/$(basename "$asset")" > "$output_dir/$(basename "$asset").gz"
    fi
done

# Generate asset manifest
echo "📋 Generating asset manifest..."
find /app/dist -type f -name "*" | sed 's|/app/dist/||' > /app/dist/manifest.txt

echo "✅ Asset optimization complete!"
echo "📊 Optimization summary:"
echo "  - Total files processed: $(wc -l < /app/dist/manifest.txt)"
echo "  - Images optimized: $(find /app/dist -name "*.webp" -o -name "*.jpg" -o -name "*.png" | wc -l)"
echo "  - SVGs optimized: $(find /app/dist -name "*.svg" | wc -l)"
echo "  - JS/CSS minified: $(find /app/dist -name "*.js" -o -name "*.css" | wc -l)"

EOF

RUN chmod +x optimize-assets.sh

# Run optimization
CMD ["./optimize-assets.sh"]