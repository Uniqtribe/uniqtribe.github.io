
    let minPaletteCount = 0;
    let recommendedPaletteCount = 0;
    let maxPaletteCount = 0;
    // Function to calculate the Euclidean distance between two colors
    function getColorDistance(c1, c2) {
      return Math.sqrt(
        Math.pow(c2[0] - c1[0], 2) +
        Math.pow(c2[1] - c1[1], 2) +
        Math.pow(c2[2] - c1[2], 2)
      );
    }

    // Function to calculate the frequency of colors in the image based on Color Thief's palette
    function calculateColorFrequency(image, palette) {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      // Initialize an array to track pixel counts for each color in the palette
      let colorFrequency = new Array(palette.length).fill(0);

      // Loop over all the pixels in the image and assign them to the closest dominant color
      for (let i = 0; i < pixelData.length; i += 4) {
        const r = pixelData[i];
        const g = pixelData[i + 1];
        const b = pixelData[i + 2];
        const pixelColor = [r, g, b];

        // Find the closest color from the palette
        let closestIndex = -1;
        let minDistance = Infinity;
        for (let j = 0; j < palette.length; j++) {
          const paletteColor = palette[j];
          const distance = getColorDistance(pixelColor, paletteColor);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = j;
          }
        }

        // Increment the count for the closest color
        colorFrequency[closestIndex]++;
      }

      // Calculate total pixels (considering RGB channels, each pixel is 4 bytes: RGBA)
      const totalPixels = pixelData.length / 4;

      // Return the colors with their frequency percentage
      return palette.map((color, index) => ({
        color,
        frequency: ((colorFrequency[index] / totalPixels) * 100).toFixed(2) // Percentage
      }));
    }

       function calculateClusterVariance(cluster) {
  // Calculate the average color of the cluster
  const avgColor = cluster.reduce(
    (acc, color) => {
      acc[0] += color[0];
      acc[1] += color[1];
      acc[2] += color[2];
      return acc;
    },
    [0, 0, 0]
  ).map(c => c / cluster.length);

  // Calculate the variance of the cluster by calculating the squared differences
  const variances = [0, 0, 0]; // Variances for R, G, B channels
  cluster.forEach(color => {
    for (let i = 0; i < 3; i++) {
      variances[i] += Math.pow(color[i] - avgColor[i], 2);
    }
  });

  // Calculate the average variance per channel
  const avgVariance = variances.map(v => v / cluster.length);

  // Combine the variances of the channels into a single value (root mean square)
  const clusterVariance = Math.sqrt(avgVariance.reduce((sum, v) => sum + v, 0));

  return clusterVariance;
}

function simpleClusterColors(palette) {
  const threshold = 100; // Adjust the threshold for more distinct clusters
  let clusters = [];

  // Start by assuming each color is its own cluster
  for (let i = 0; i < palette.length; i++) {
    let color = palette[i];
    let addedToCluster = false;

    // Check if this color is close to any existing cluster
    for (let cluster of clusters) {
      const clusterCenter = cluster[0]; // Take the first color as the cluster's center
      const distance = getColorDistance(color, clusterCenter);

      if (distance < threshold) {
        // If the color is close enough to a cluster, add it to that cluster
        cluster.push(color);
        addedToCluster = true;
        break;
      }
    }

    // If this color is not close to any existing cluster, create a new cluster for it
    if (!addedToCluster) {
      clusters.push([color]);
    }
  }

  // Compute the average color for each cluster
  const averagedColors = clusters.map(cluster => {
    const sumColor = cluster.reduce((acc, color) => {
      acc[0] += color[0];
      acc[1] += color[1];
      acc[2] += color[2];
      return acc;
    }, [0, 0, 0]);

    const avgColor = sumColor.map(c => Math.round(c / cluster.length));
    return avgColor;
  });

  // Calculate variance for each cluster
  const clusterVariances = clusters.map(cluster => calculateClusterVariance(cluster));

  // Return the average colors and their variance
  return { averagedColors, clusterVariances };
}

function getColorDistance(color1, color2) {
  const rDiff = color1[0] - color2[0];
  const gDiff = color1[1] - color2[1];
  const bDiff = color1[2] - color2[2];
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}
function calculateClusterVariance(cluster) {
  // Calculate the average color of the cluster
  const avgColor = cluster.reduce(
    (acc, color) => {
      acc[0] += color[0];
      acc[1] += color[1];
      acc[2] += color[2];
      return acc;
    },
    [0, 0, 0]
  ).map(c => c / cluster.length);

  // Calculate the variance of the cluster by calculating the squared differences
  const variances = [0, 0, 0]; // Variances for R, G, B channels
  cluster.forEach(color => {
    for (let i = 0; i < 3; i++) {
      variances[i] += Math.pow(color[i] - avgColor[i], 2);
    }
  });

  // Calculate the average variance per channel
  const avgVariance = variances.map(v => v / cluster.length);
  // Combine the variances of the channels into a single value (root mean square)
  const clusterVariance = Math.sqrt(avgVariance.reduce((sum, v) => sum + v, 0));
  return clusterVariance;
}


    // Event listener for image input
  /*  document.getElementById('imageInput').addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (file) {
        const image = new Image();
        image.src = URL.createObjectURL(file);

        image.onload = () => {
          // Extract 10 dominant colors using Color Thief
          const colorThief = new ColorThief();
          let palette = colorThief.getPalette(image, 10); // Extract 10 dominant colors

          console.log('Extracted Palette:', palette);

          // Calculate frequency of each color based on clustering the image pixels to these dominant colors
 // Create a canvas to extract image data
 const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  
  // Draw the image onto the canvas
  ctx.drawImage(image, 0, 0);

  // Get the pixel data from the canvas
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Extract RGB data from imageData
  const pixels = [];
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    pixels.push([r, g, b]);
  }

          // Cluster the palette
          const { averagedColors, clusterVariances } = simpleClusterColors(palette, pixels);
const colorFrequency = calculateColorFrequency(image, averagedColors);

const normalize = (value, min, max) => (value - min) / (max - min);

// Find min/max for frequency and variance
const minFrequency = Math.min(...colorFrequency.map(c => c.frequency));
const maxFrequency = Math.max(...colorFrequency.map(c => c.frequency));
const minVariance = Math.min(...clusterVariances);
const maxVariance = Math.max(...clusterVariances);

// Apply normalization and filter colors
const minFrequencyThreshold = 0.90; // Set threshold for high frequency (can be adjusted)
const maxVarianceThreshold = 0.10;  // Set threshold for low variance (can be adjusted)

const filteredColors = averagedColors.filter((color, index) => {
    
    const normalizedFrequency = normalize(colorFrequency[index].frequency, minFrequency, maxFrequency);
    const normalizedVariance = normalize(clusterVariances[index], minVariance, maxVariance);

  return normalizedFrequency >= minFrequencyThreshold || normalizedVariance <= maxVarianceThreshold;
});
/*
         // Display the results on the web page
          averagedColors.forEach((color, index) => {
            const colorDiv = document.createElement('div');
            colorDiv.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
           // colorDiv.textContent = `RGB(${color[0]}, ${color[1]}, ${color[2]}) - Variance: ${clusterVariances[index].toFixed(2)}`;
            // Assuming `colorDiv` is where you're displaying the color and its variance
colorDiv.textContent = `RGB(${color[0]}, ${color[1]}, ${color[2]}) - Variance: ${clusterVariances[index]} - Frequency: ${colorFrequency[index].frequency}` ;

            colorDiv.style.padding = '10px';
            colorDiv.style.margin = '5px';
            document.body.appendChild(colorDiv);
          });*/

   //       maxPaletteCount = averagedColors.length;

/*
          palette = colorThief.getPalette(image, 3); // Extract 10 dominant colors

        console.log('Extracted Palette:', palette);
        palette = colorThief.getPalette(image, 2); // Extract 10 dominant colors

console.log('Extracted Palette:', palette);


          filteredColors.forEach((color, index) => {
            const colorDiv = document.createElement('div');
            colorDiv.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
           // colorDiv.textContent = `RGB(${color[0]}, ${color[1]}, ${color[2]}) - Variance: ${clusterVariances[index].toFixed(2)}`;
            // Assuming `colorDiv` is where you're displaying the color and its variance
colorDiv.textContent = `RGB(${color[0]}, ${color[1]}, ${color[2]}) - Variance: ${clusterVariances[index]} - Frequency: ${colorFrequency[index].frequency}` ;

            colorDiv.style.padding = '10px';
            colorDiv.style.margin = '5px';
            document.body.appendChild(colorDiv);
          });*/
/*          recommendedPaletteCount = filteredColors.length;

          for(let i = recommendedPaletteCount; i <= maxPaletteCount; i++){
            palette = colorThief.getPalette(image, i); // Extract 10 dominant colors

            const schemes = generatePalettes(palette);
            generatePaletteStructure(palette);
*/
/*                palette.forEach((color, index) => {
                    const colorDiv = document.createElement('div');
                    colorDiv.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                    colorDiv.textContent = `RGB(${color[0]}, ${color[1]}, ${color[2]}) - Variance: ${clusterVariances[index]} - Frequency: ${colorFrequency[index].frequency}` ;

                    colorDiv.style.padding = '10px';
                    colorDiv.style.margin = '5px';
                    document.body.appendChild(colorDiv);
                });
*/
/*

const paletteValues = Object.values(schemes);  // Get only the color arrays (values)

const uniquePalettes = [];
const removedPalettes = [];

paletteValues.forEach((currentPalette, index) => {
  // Check if this palette is similar to any existing ones
  const isSimilar = uniquePalettes.some(existingPalette => 
    arePalettesSimilar(existingPalette, currentPalette)
  );

  if (!isSimilar) {
    uniquePalettes.push(currentPalette);
  } else {
    // Log the removed palette
    const paletteName = Object.keys(palette)[index];
    removedPalettes.push({ [paletteName]: currentPalette });
  }
});

// Now uniquePalettes contains only non-similar palettes
console.log("Unique Palettes:");
console.log(uniquePalettes);
const { uniqueColoredPalettes, removedColoredPalettes } = removePalettesWithSimilarColors(uniquePalettes)
console.log("Removed Palettes:");
console.log(uniqueColoredPalettes);
for(let i = 0; i < uniqueColoredPalettes.length; i++){
    generatePaletteStructure(uniqueColoredPalettes[i]);
}
*/
                  
/*
                    const gradient = palette.map((colorItem, idx) => {
                        console.log("colorItem",colorItem)
                        const position = (idx / (palette.length - 1)) * 100;
                        return `rgb(${colorItem[0]}, ${colorItem[1]}, ${colorItem[2]}) ${position}%`;
                    }).join(", ");
                    
                    // Apply the gradient background
                    colorDiv.style.backgroundImage = `linear-gradient(to right, ${gradient})`;
                    
                    // Add the color, variance, and frequency as text content
                    colorDiv.textContent = palette.map((colorItem, idx) => {
                        return `RGB(${colorItem[0]}, ${colorItem[1]}, ${colorItem[2]}) - Variance: ${clusterVariances[idx]} - Frequency: ${colorFrequency[idx].frequency}`;
                    }).join(' | ');
*/
                 
      /*          
          }
        };
      }
    });
*/
    function generateVerticalGradient(colors, isCustom = false) {
    const segmentSize = 100 / colors.length;
    console.log("segmentSize",segmentSize);


    const gradientSegments = colors.map((color, index) => {
        const startPercent = index * segmentSize;
        const endPercent = (index + 1) * segmentSize;
        return `rgb(${color[0]},${color[1]},${color[2]}) ${startPercent}% ${endPercent}%`;
    }).join(', ');

    return isCustom ? `linear-gradient(to right, ${gradientSegments})` : `linear-gradient(to right, ${gradientSegments})`;
}
function generatePalettes(palette) {
    const palettes = {
        Analogous: [],
        Complementary: [],
        Triadic: [],
        SplitComplementary: [],
        Monochromatic: [],
        Tetradic: [],
        Square: [],
        SplitTriadic: [],
        Accent: [],
        ShadesGradients: [],
        Warm: [],
        Cool: [],
        Pastel: [],
        Earthy: [],
        Neon: [],
        HighContrast: [],
        Muted: [],
        Vibrant: [],
        Gradient:[],
        Tonal:[],
        Polychromatic:[],
        Retro:[],
        Spring:[],
        Summer:[],
        Autumn:[],
        Winter:[],
        Corporate:[],
        Sporty:[],
        Minimalist:[],
        Luxury:[],
        Candy:[],
        Floral:[],
        Oceanic:[],
        Metallic:[],
        Tropical:[],
        Sunset:[],
        Galaxy:[],
        Forest:[],
        Rainbow:[],
        SciFi:[],
        Vintage:[],
        DarkMode:[],
        HighSaturation:[],
        LowSaturation:[],
        Ethnic:[],
        Industrial:[],
        NatureInspired:[],
        Solar:[],
        Aurora:[],
        Citrus:[],
        SandAndSea:[],
        Desert:[],
        Ice:[],
        Fire:[],
        JewelTone:[],
        VintageCinema:[],
        Futuristic:[],
        AutumnLeaves:[],
        WinterWonderland:[],
        SpringBlossom:[],
        SummerSky:[],
        Underwater:[],
        Coffee:[],
        Rustic:[],
        Festival:[],
        Royal:[],
        Cyberpunk:[],
        NaturesHarvest:[],
        Urban:[],
        GalaxyNight:[],
        FloralPastel:[],
        OceanSunset:[],
        Greyscale:[],
        RainbowPastel:[],
        MutedEarth:[],
        ForestTwilight:[],
        Polar:[],
        Peacock:[],
        PixelArt:[],
        GradientSpectrum:[],
        FlatUI:[],
        SciFiNeon:[],
        MetalAndStone:[],
        Weather:[],
        ComicBook:[],
        MinimalistNeutral:[],
        CandyCoated:[],
        Gothic:[],
        Garden:[],
        FrostedGlass:[],
        Painterly:[],
        ShadowAndLight:[],
        NightSky:[],
        CoralReef:[],
        Marble:[],
        Smoke:[],
        StainedGlass:[],
        MinimalEarth:[],
      
    };

    const paletteLength = palette.length;

    palette.forEach(([r, g, b], i) => {
        const [h, s, v] = rgbToHsv(r, g, b);

        // Analogous: Evenly distribute angles
        const analogousOffset = 30 * (i % 2 === 0 ? 1 : -1);
        palettes.Analogous.push(hsvToRgb((h + analogousOffset) % 360, s, v));

        // Complementary
        palettes.Complementary.push(hsvToRgb((h + 180) % 360, s, v));

        // Triadic: Use offsets spaced by 120 degrees
        const triadicOffset = 120 * ((i % 3) - 1);
        palettes.Triadic.push(hsvToRgb((h + triadicOffset + 360) % 360, s, v));

        // Split Complementary
        const splitOffset = 150 * (i % 2 === 0 ? 1 : -1);
        palettes.SplitComplementary.push(hsvToRgb((h + splitOffset) % 360, s, v));

        // Monochromatic: Lighter and darker variations
        palettes.Monochromatic.push(hsvToRgb(h, s, Math.min(v + (i + 1) * 0.1, 1)));

        // Tetradic: Use two complementary pairs
        const tetradicOffsets = [0, 180, 90, -90];
        palettes.Tetradic.push(hsvToRgb((h + tetradicOffsets[i % 4] + 360) % 360, s, v));

        // Square: Four evenly spaced
        palettes.Square.push(hsvToRgb((h + (i * 90) % 360) % 360, s, v));

        // Split Triadic
        palettes.SplitTriadic.push(hsvToRgb((h + splitOffset) % 360, s, v));

        // Accent: Alternate complementary or triadic offsets
        const accentOffset = 180 - (i % 2 === 0 ? 30 : -30);
        palettes.Accent.push(hsvToRgb((h + accentOffset) % 360, s, v));

        // Shades/Gradients
        palettes.ShadesGradients.push(hsvToRgb(h, s, v * (1 - i * 0.2)));

        // Warm and Cool
        palettes.Warm.push(hsvToRgb((h + 30) % 360, s, v)); // Warm
        palettes.Cool.push(hsvToRgb((h + 180) % 360, s, v)); // Cool

        // Pastel
        palettes.Pastel.push(hsvToRgb(h, 0.3, Math.min(v + (i + 1) * 0.2, 1)));

        // Earthy
        palettes.Earthy.push(hsvToRgb(h, s * 0.5, v * 0.7));

        // Neon
        palettes.Neon.push(hsvToRgb(h, 1, 1));

        // High Contrast
        palettes.HighContrast.push(hsvToRgb((h + 180) % 360, s, Math.max(v - 0.2, 0)));

        // Muted
        palettes.Muted.push(hsvToRgb(h, s * 0.5, v * 0.8));

        // Vibrant
        palettes.Vibrant.push(hsvToRgb(h, 1, Math.min(v + 0.3, 1)));

         // Gradient Palette: Smooth transitions between input colors.
    palettes.Gradient.push(hsvToRgb(h, s, Math.min(v + 0.3, 1)));

// Tonal Palette: Variations of brightness and saturation for each color.
palettes.Tonal.push(hsvToRgb(h, s, Math.min(v + 0.2, 1)));

// Polychromatic Palette: Multiple colors spread across the color wheel.
const polychromaticOffset = 45 * (i % 2 === 0 ? 1 : -1);
palettes.Polychromatic.push(hsvToRgb((h + polychromaticOffset) % 360, s, v));

// Retro Palette: Muted, vintage-inspired tones.
palettes.Retro.push(hsvToRgb(h, s * 0.6, Math.min(v + 0.1, 1)));

// Seasonal Palettes:
// Spring: Light pastels.
palettes.Spring.push(hsvToRgb(h, s * 0.3, Math.min(v + 0.4, 1)));

// Summer: Warm and vivid tones.
palettes.Summer.push(hsvToRgb(h, s, Math.min(v + 0.2, 1)));

// Autumn: Earthy and deep colors.
palettes.Autumn.push(hsvToRgb(h, s * 0.7, v * 0.8));

// Winter: Cool and icy tones.
palettes.Winter.push(hsvToRgb(h, s * 0.5, Math.min(v - 0.1, 1)));

// Corporate Palette: Neutral and muted professional tones.
palettes.Corporate.push(hsvToRgb(h, s * 0.5, v * 0.6));

// Sporty Palette: Bold and energetic colors.
palettes.Sporty.push(hsvToRgb(h, s, Math.min(v + 0.5, 1)));

// Minimalist Palette: Soft, neutral, or monochromatic tones.
palettes.Minimalist.push(hsvToRgb(h, s * 0.2, Math.min(v + 0.1, 1)));

// Luxury Palette: Deep, rich tones like gold and jewels.
palettes.Luxury.push(hsvToRgb(h, s, Math.min(v + 0.4, 1)));

// Candy Palette: Bright and playful tones inspired by candy.
palettes.Candy.push(hsvToRgb(h, 1, Math.min(v + 0.6, 1)));

// Floral Palette: Pastel and vivid bloom-inspired tones.
palettes.Floral.push(hsvToRgb(h, s * 0.3, Math.min(v + 0.2, 1)));

// Oceanic Palette: Blues, teals, and greens inspired by the sea.
palettes.Oceanic.push(hsvToRgb((h + 120) % 360, s, Math.min(v + 0.3, 1)));

 // Metallic Palette: Gold, silver, bronze, and other reflective tones.
 const metallicHues = [45, 0, 30]; // Approximate hues for gold, silver, and bronze
    palettes.Metallic.push(hsvToRgb(metallicHues[i % 3], s * 0.8, v * 0.9));

    // Tropical Palette: Vibrant and lush colors inspired by tropical flora and fauna.
    palettes.Tropical.push(hsvToRgb(h, 1, Math.min(v + 0.3, 1)));

    // Sunset Palette: Warm gradients of orange, pink, and purple.
    const sunsetOffset = 60 * (i % 3); // Gradual transitions across orange, pink, and purple
    palettes.Sunset.push(hsvToRgb((h + sunsetOffset) % 360, Math.min(s + 0.2, 1), v));

    // Galaxy Palette: Dark purples, blues, and bright star-like accents.
    const galaxyHues = [270, 240, 300]; // Purples and blues
    palettes.Galaxy.push(hsvToRgb(galaxyHues[i % 3], s, Math.min(v - 0.2 + (i % 2) * 0.4, 1)));

    // Forest Palette: Greens, browns, and natural tones of the forest.
    const forestHues = [120, 30]; // Greens and browns
    palettes.Forest.push(hsvToRgb(forestHues[i % 2], s * 0.7, v * 0.8));

    // Rainbow Palette: All colors of the spectrum.
    const rainbowStep = (360 / palette.length) * i;
    palettes.Rainbow.push(hsvToRgb(rainbowStep, 1, 1));

    // Sci-Fi Palette: Futuristic and neon-inspired, with glowing effects.
    palettes.SciFi.push(hsvToRgb(h, 1, Math.min(v + 0.5, 1)));

    // Vintage Palette: Desaturated colors inspired by old photos and posters.
    palettes.Vintage.push(hsvToRgb(h, s * 0.5, v * 0.7));

    // Dark Mode Palette: Primarily dark tones with pops of bright accents.
    if (i % 4 === 0) {
        palettes.DarkMode.push(hsvToRgb(h, s, Math.min(v + 0.5, 1))); // Bright accent
    } else {
        palettes.DarkMode.push(hsvToRgb(h, s * 0.2, v * 0.4)); // Dark tone
    }

    // High Saturation Palette: Extremely vivid and intense colors.
    palettes.HighSaturation.push(hsvToRgb(h, 1, v));

    // Low Saturation Palette: Muted, almost grayscale colors.
    palettes.LowSaturation.push(hsvToRgb(h, s * 0.2, v * 0.8));

    // Ethnic Palette: Traditional color schemes inspired by specific cultures or regions.
    const ethnicHues = [0, 60, 120, 240]; // Reds, yellows, greens, and blues
    palettes.Ethnic.push(hsvToRgb(ethnicHues[i % 4], s, v));

    // Industrial Palette: Greys, blacks, and metallic colors for a modern aesthetic.
    palettes.Industrial.push(hsvToRgb(h, s * 0.1, v * (0.5 + (i % 2) * 0.3)));

    // Nature-Inspired Palette: Earthy greens, sky blues, and natural browns.
    const natureHues = [120, 210, 30]; // Greens, blues, browns
    palettes.NatureInspired.push(hsvToRgb(natureHues[i % 3], s * 0.7, v * 0.9));

    // Solar Palette: Warm yellows, oranges, and fiery reds.
    const solarHues = [45, 30, 0]; // Yellows, oranges, reds
    palettes.Solar.push(hsvToRgb(solarHues[i % 3], s, v));

    // Aurora Palette: Shades of green, blue, and purple inspired by the northern lights.
    const auroraHues = [120, 180, 270]; // Greens, blues, purples
    palettes.Aurora.push(hsvToRgb(auroraHues[i % 3], s * 0.8, Math.min(v + 0.3, 1)));

    // Citrus Palette: Fresh, tangy yellows, oranges, and greens.
    const citrusHues = [60, 30, 120]; // Yellows, oranges, greens
    palettes.Citrus.push(hsvToRgb(citrusHues[i % 3], s, v));

    // Sand and Sea Palette: Beige, blue, and turquoise inspired by beaches.
    const sandSeaHues = [30, 210, 180]; // Beige, blue, turquoise
    palettes.SandAndSea.push(hsvToRgb(sandSeaHues[i % 3], s * 0.5, Math.min(v + 0.2, 1)));

     // Desert Palette: Warm sandy tones with orange and light brown.
     const desertHues = [30, 30]; // Oranges and browns
    palettes.Desert.push(hsvToRgb(desertHues[i % 2], s * 0.8, v * 0.9));

    // Ice Palette: Cool, frosty whites, blues, and light greys.
    const iceHues = [200, 210]; // Blues and cool tones
    palettes.Ice.push(hsvToRgb(iceHues[i % 2], s * 0.5, Math.min(v + 0.3, 1)));

    // Fire Palette: Reds, oranges, and yellows, inspired by flames.
    const fireHues = [0, 30, 60]; // Reds, oranges, yellows
    palettes.Fire.push(hsvToRgb(fireHues[i % 3], s, v));

    // Jewel Tone Palette: Rich, saturated colors like emerald, ruby, sapphire, and amethyst.
    const jewelHues = [120, 0, 240, 270]; // Emerald, ruby, sapphire, amethyst
    palettes.JewelTone.push(hsvToRgb(jewelHues[i % 4], 1, 1));

    // Vintage Cinema Palette: Sepia tones, faded blacks, and muted whites.
    palettes.VintageCinema.push(hsvToRgb(h, s * 0.5, v * 0.6));

    // Futuristic Palette: Neon greens, silvers, and bold contrasts for a tech-inspired look.
    const futuristicHues = [120, 0, 240]; // Neon greens, silvers, bold contrasts
    palettes.Futuristic.push(hsvToRgb(futuristicHues[i % 3], 1, Math.min(v + 0.5, 1)));

    // Autumn Leaves Palette: Warm reds, oranges, yellows, and browns.
    const autumnHues = [0, 30, 60, 30]; // Reds, oranges, yellows, browns
    palettes.AutumnLeaves.push(hsvToRgb(autumnHues[i % 4], s, Math.min(v + 0.3, 1)));

    // Winter Wonderland Palette: Whites, icy blues, and pale greys.
    const winterHues = [200, 210]; // Icy blues and whites
    palettes.WinterWonderland.push(hsvToRgb(winterHues[i % 2], s * 0.5, Math.min(v + 0.3, 1)));

    // Spring Blossom Palette: Soft pinks, fresh greens, and light yellows.
    const springHues = [330, 120, 60]; // Soft pinks, greens, yellows
    palettes.SpringBlossom.push(hsvToRgb(springHues[i % 3], 1, Math.min(v + 0.4, 1)));

    // Summer Sky Palette: Vivid blues, whites, and soft purples.
    const summerHues = [210, 240, 270]; // Blues, purples
    palettes.SummerSky.push(hsvToRgb(summerHues[i % 3], 1, v));

    // Underwater Palette: Deep blues, aquas, and hints of coral pink.
    const underwaterHues = [200, 190, 10]; // Blues, aquas, coral pinks
    palettes.Underwater.push(hsvToRgb(underwaterHues[i % 3], s, v));

    // Coffee Palette: Browns, tans, and cream tones, inspired by coffee.
    const coffeeHues = [30, 15, 0]; // Browns, tans, creams
    palettes.Coffee.push(hsvToRgb(coffeeHues[i % 3], s * 0.7, v * 0.8));

    // Rustic Palette: Earthy tones like olive green, terracotta, and brick red.
    const rusticHues = [120, 30, 0]; // Olive greens, terracotta, brick red
    palettes.Rustic.push(hsvToRgb(rusticHues[i % 3], s, v));

    // Festival Palette: Bright, vivid colors like hot pink, orange, and yellow.
    const festivalHues = [330, 30, 60]; // Hot pink, orange, yellow
    palettes.Festival.push(hsvToRgb(festivalHues[i % 3], 1, Math.min(v + 0.3, 1)));

    // Royal Palette: Deep purples, golds, and midnight blues.
    const royalHues = [270, 45, 240]; // Deep purples, golds, midnight blues
    palettes.Royal.push(hsvToRgb(royalHues[i % 3], 1, v));

    // Cyberpunk Palette: Neon pinks, purples, blues, and greens on dark backgrounds.
    const cyberpunkHues = [330, 240, 180, 120]; // Neon pinks, purples, greens, blues
    palettes.Cyberpunk.push(hsvToRgb(cyberpunkHues[i % 4], 1, Math.min(v + 0.5, 1)));

    // Nature’s Harvest Palette: Yellows, greens, and browns inspired by crops and fields.
    const harvestHues = [60, 120, 30]; // Yellows, greens, browns
    palettes.NaturesHarvest.push(hsvToRgb(harvestHues[i % 3], s, v));

    // Urban Palette: Greys, blacks, and concrete-inspired neutral tones.
    const urbanHues = [0, 0, 0]; // Greys, blacks
    palettes.Urban.push(hsvToRgb(urbanHues[i % 2], s * 0.3, v * 0.6));

    // Galaxy Night Palette: Deep blues, purples, and bright starry whites.
    const galaxyNightHues = [240, 270, 0]; // Deep blues, purples, whites
    palettes.GalaxyNight.push(hsvToRgb(galaxyNightHues[i % 3], s, Math.min(v + 0.3, 1)));

    // Floral Pastel Palette: Light pinks, lavenders, and mint greens.
    const floralPastelHues = [330, 270, 120]; // Pinks, lavenders, mint greens
    palettes.FloralPastel.push(hsvToRgb(floralPastelHues[i % 3], 0.3, Math.min(v + 0.3, 1)));

    // Ocean Sunset Palette: Oranges, pinks, and deep blues fading into one another.
    const oceanSunsetHues = [30, 330, 240]; // Oranges, pinks, blues
    palettes.OceanSunset.push(hsvToRgb(oceanSunsetHues[i % 3], s, Math.min(v + 0.4, 1)));

    // Greyscale Palette: A full range of grey tones from black to white.
    palettes.Greyscale.push(hsvToRgb(h, 0, v));

    // Rainbow Pastel Palette: Softened versions of the rainbow.
    const rainbowPastelStep = (360 / palette.length) * i;
    palettes.RainbowPastel.push(hsvToRgb(rainbowPastelStep, 0.2, Math.min(v + 0.4, 1)));

    // Muted Earth Palette: Subdued greens, browns, and creams for a grounded feel.
    const mutedEarthHues = [120, 30, 60]; // Greens, browns, creams
    palettes.MutedEarth.push(hsvToRgb(mutedEarthHues[i % 3], s * 0.5, v * 0.7));

    // Forest Twilight Palette: Dark greens, blues, and hints of yellow or orange.
    const twilightHues = [120, 240, 30]; // Dark greens, blues, yellows
    palettes.ForestTwilight.push(hsvToRgb(twilightHues[i % 3], s, v));

    // Polar Palette: Bright whites and light blues with darker navy accents.
    const polarHues = [0, 210, 240]; // Whites, blues, navy
    palettes.Polar.push(hsvToRgb(polarHues[i % 3], s * 0.5, v));

    // Peacock Palette: Vibrant greens, blues, and purples inspired by peacock feathers.
    const peacockHues = [120, 200, 270]; // Greens, blues, purples
    palettes.Peacock.push(hsvToRgb(peacockHues[i % 3], s, Math.min(v + 0.2, 1)));

     // Pixel Art Palette: Limited colors with high contrast, inspired by retro games.
     const pixelArtHues = [0, 30, 210, 240]; // Primary and high-contrast tones
    palettes.PixelArt.push(hsvToRgb(pixelArtHues[i % 4], 1, v > 0.5 ? 1 : 0.5));

    // Gradient Spectrum Palette: Full gradient transitions between all colors.
    const gradientStep = (360 / palette.length) * i;
    palettes.GradientSpectrum.push(hsvToRgb(gradientStep, 1, 1));

    // Flat UI Palette: Minimalist colors for modern interface designs.
    const flatUIHues = [210, 120, 45, 15]; // Cool blues, greens, and soft oranges
    palettes.FlatUI.push(hsvToRgb(flatUIHues[i % 4], 0.6, 0.8));

    // Sci-Fi Neon Palette: Futuristic neon combinations like teal, magenta, and black.
    const sciFiHues = [180, 300, 0]; // Teal, magenta, black accents
    palettes.SciFiNeon.push(hsvToRgb(sciFiHues[i % 3], 1, v > 0.7 ? 1 : v * 0.5));

    // Metal and Stone Palette: Greys, silvers, and deep browns with metallic accents.
    palettes.MetalAndStone.push(hsvToRgb(h, 0.2, v * 0.6));

    // Weather Palette: Soft greys, whites, and blues for cloudy or rainy themes.
    const weatherHues = [210, 220, 0]; // Soft blues and greys
    palettes.Weather.push(hsvToRgb(weatherHues[i % 3], 0.3, Math.min(v + 0.4, 1)));

    // Comic Book Palette: Bright primary colors with strong contrast and bold outlines.
    const comicHues = [0, 60, 240]; // Red, yellow, blue
    palettes.ComicBook.push(hsvToRgb(comicHues[i % 3], 1, 1));

    // Minimalist Neutral Palette: Subtle greys, whites, and soft pastels.
    palettes.MinimalistNeutral.push(hsvToRgb(h, s * 0.3, Math.min(v + 0.2, 1)));

    // Candy-Coated Palette: Bright, sugary colors like bubblegum pink and candy apple red.
    const candyHues = [330, 0, 60]; // Bubblegum pink, red, yellow
    palettes.CandyCoated.push(hsvToRgb(candyHues[i % 3], 0.9, 1));

    // Gothic Palette: Deep blacks, purples, and reds for dramatic flair.
    const gothicHues = [270, 0]; // Purples and reds
    palettes.Gothic.push(hsvToRgb(gothicHues[i % 2], s, v * 0.6));

    // Garden Palette: Greens, soft florals, and earthy browns.
    const gardenHues = [120, 90, 30]; // Greens, florals, browns
    palettes.Garden.push(hsvToRgb(gardenHues[i % 3], s, Math.min(v + 0.3, 1)));

    // Frosted Glass Palette: Pastels with a soft translucent effect.
    palettes.FrostedGlass.push(hsvToRgb(h, s * 0.4, v * 0.8));

    // Painterly Palette: Colors mimicking brush strokes, with soft blending and vibrant hues.
    palettes.Painterly.push(hsvToRgb(h, s * 0.7, v * 0.9));

    // Shadow and Light Palette: High-contrast blacks and whites with soft in-betweens.
    palettes.ShadowAndLight.push(hsvToRgb(h, 0, v > 0.5 ? 1 : v * 0.4));

    // Night Sky Palette: Deep blues, purples, and bright stars.
    const nightSkyHues = [240, 270, 0]; // Deep blues, purples, whites
    palettes.NightSky.push(hsvToRgb(nightSkyHues[i % 3], s, Math.min(v + 0.3, 1)));

    // Coral Reef Palette: Vibrant coral, teal, and seafoam greens.
    const coralHues = [15, 180, 160]; // Coral, teal, seafoam
    palettes.CoralReef.push(hsvToRgb(coralHues[i % 3], s, Math.min(v + 0.5, 1)));

    // Marble Palette: White, grey, and subtle veins of black or gold.
    const marbleHues = [0, 45, 0]; // Gold accents, whites, greys
    palettes.Marble.push(hsvToRgb(marbleHues[i % 3], s * 0.2, Math.min(v + 0.5, 1)));

    // Smoke Palette: Subtle greys, whites, and very light blues or purples.
    const smokeHues = [210, 220, 270]; // Greys, whites, light blues
    palettes.Smoke.push(hsvToRgb(smokeHues[i % 3], s * 0.2, v * 0.8));

    // Stained Glass Palette: Bright primary and secondary colors with dark dividing lines.
    const stainedGlassHues = [0, 60, 120, 240]; // Red, yellow, green, blue
    palettes.StainedGlass.push(hsvToRgb(stainedGlassHues[i % 4], 1, v));

    // Minimal Earth Palette: A more subdued take on earthy tones.
    const minimalEarthHues = [90, 30, 60]; // Muted greens, browns, and creams
    palettes.MinimalEarth.push(hsvToRgb(minimalEarthHues[i % 3], s * 0.5, v * 0.8));

   
    
    });

    /*
    generatePaletteStructure(palettes.Analogous);
    generatePaletteStructure(palettes.Complementary);
    generatePaletteStructure(palettes.Triadic);
    generatePaletteStructure(palettes.SplitComplementary);
    generatePaletteStructure(palettes.Tetradic);
    
    generatePaletteStructure(palettes.Square);
    generatePaletteStructure(palettes.SplitTriadic);
    generatePaletteStructure(palettes.Accent);
    generatePaletteStructure(palettes.ShadesGradients);
    generatePaletteStructure(palettes.Warm);
    generatePaletteStructure(palettes.Cool);
    generatePaletteStructure(palettes.Pastel);
    generatePaletteStructure(palettes.Earthy);
    generatePaletteStructure(palettes.Neon);
    generatePaletteStructure(palettes.HighContrast);
    generatePaletteStructure(palettes.Muted);
    generatePaletteStructure(palettes.Vibrant);
    generatePaletteStructure(palettes.Retro);
    generatePaletteStructure(palettes.Spring);
    generatePaletteStructure(palettes.Summer);
    generatePaletteStructure(palettes.Autumn);
    generatePaletteStructure(palettes.Winter);
    generatePaletteStructure(palettes.Corporate);
    generatePaletteStructure(palettes.Sporty);
    generatePaletteStructure(palettes.Minimalist);
    generatePaletteStructure(palettes.Luxury);
    generatePaletteStructure(palettes.Candy);
    generatePaletteStructure(palettes.Floral);
    generatePaletteStructure(palettes.Oceanic);
    generatePaletteStructure(palettes.Metallic);
    generatePaletteStructure(palettes.Tropical);
    generatePaletteStructure(palettes.Sunset);
    generatePaletteStructure(palettes.Galaxy);
    generatePaletteStructure(palettes.Forest);
    generatePaletteStructure(palettes.Rainbow);
    generatePaletteStructure(palettes.SciFi);
    generatePaletteStructure(palettes.Vintage);
    generatePaletteStructure(palettes.DarkMode);
    generatePaletteStructure(palettes.HighSaturation);
    generatePaletteStructure(palettes.LowSaturation);
    generatePaletteStructure(palettes.Ethnic);
    generatePaletteStructure(palettes.Industrial);
    generatePaletteStructure(palettes.NatureInspired);
    generatePaletteStructure(palettes.Solar);
    generatePaletteStructure(palettes.Aurora);
    generatePaletteStructure(palettes.Citrus);
    generatePaletteStructure(palettes.SandAndSea);   
    
    generatePaletteStructure(palettes.Desert);   
    generatePaletteStructure(palettes.Ice);   
    generatePaletteStructure(palettes.Fire);   
    generatePaletteStructure(palettes.JewelTone);   
    generatePaletteStructure(palettes.VintageCinema);   
    generatePaletteStructure(palettes.Futuristic);   
    generatePaletteStructure(palettes.AutumnLeaves);   
    generatePaletteStructure(palettes.WinterWonderland);   
    generatePaletteStructure(palettes.SpringBlossom);   
    generatePaletteStructure(palettes.SummerSky);   
    generatePaletteStructure(palettes.Underwater);   
    generatePaletteStructure(palettes.Coffee);   
    generatePaletteStructure(palettes.Rustic);   
    generatePaletteStructure(palettes.Festival);   
    generatePaletteStructure(palettes.Royal);   
    generatePaletteStructure(palettes.Cyberpunk);   
    generatePaletteStructure(palettes.NaturesHarvest);   
    generatePaletteStructure(palettes.Urban);   
    generatePaletteStructure(palettes.GalaxyNight);   
    generatePaletteStructure(palettes.FloralPastel);   
    generatePaletteStructure(palettes.OceanSunset);   
    generatePaletteStructure(palettes.Greyscale);   
    generatePaletteStructure(palettes.RainbowPastel);   
    generatePaletteStructure(palettes.MutedEarth);   
    generatePaletteStructure(palettes.ForestTwilight);   
    generatePaletteStructure(palettes.Polar);   
    generatePaletteStructure(palettes.Peacock);   

    generatePaletteStructure(palettes.PixelArt);   
    generatePaletteStructure(palettes.GradientSpectrum);   
    generatePaletteStructure(palettes.FlatUI);   
    generatePaletteStructure(palettes.SciFiNeon);   
    generatePaletteStructure(palettes.MetalAndStone);   
    generatePaletteStructure(palettes.Weather);   
    generatePaletteStructure(palettes.ComicBook);   
    generatePaletteStructure(palettes.MinimalistNeutral);   
    generatePaletteStructure(palettes.CandyCoated);   
    generatePaletteStructure(palettes.Gothic);   
    generatePaletteStructure(palettes.Garden);   
    generatePaletteStructure(palettes.FrostedGlass);   
    generatePaletteStructure(palettes.Painterly);   
    generatePaletteStructure(palettes.ShadowAndLight);   
    generatePaletteStructure(palettes.NightSky);   
    generatePaletteStructure(palettes.CoralReef);   
    generatePaletteStructure(palettes.Marble);   
    generatePaletteStructure(palettes.Smoke);   
    generatePaletteStructure(palettes.StainedGlass);   
    generatePaletteStructure(palettes.MinimalEarth);   

*/
    

    return palettes;
}


// Helper functions
function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const delta = max - min;
    let h, s, v = max;

    if (delta === 0) h = 0;
    else if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    s = max === 0 ? 0 : delta / max;

    return [h, s, v];
}

function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r, g, b;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ];
}
function generatePaletteStructure(palette){
    const colorDiv = document.createElement('div');
                    // Construct the gradient string with the colors and positions
                    colorDiv.className = 'colorSwatches';
                    colorDiv.style.backgroundImage =generateVerticalGradient(palette);
                    colorDiv.style.padding = '10px';
                    colorDiv.style.margin = '5px';
                    colorDiv.style.height = '50px'; // Adjust the height as needed for visual appeal

                    // Append the colorDiv to the document body
                    document.body.appendChild(colorDiv);
}

function calculateEuclideanDistance(arr1, arr2) {
  const rDiff = arr1[0] - arr2[0];
  const gDiff = arr1[1] - arr2[1];
  const bDiff = arr1[2] - arr2[2];
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

function arePalettesSimilar(palette1, palette2, threshold = 100) {
  // Compare all color arrays in the palettes
  for (let i = 0; i < palette1.length; i++) {
    let isColorSimilar = false;
    for (let j = 0; j < palette2.length; j++) {
      const distance = calculateEuclideanDistance(palette1[i], palette2[j]);
      if (distance <= threshold) {
        isColorSimilar = true;
        break;
      }
    }
    if (isColorSimilar) continue;
    else return false; // If any color in palette1 doesn't match palette2, return false
  }
  return true;  // All colors in palette1 are similar to palette2
}

function areColorsSimilar(color1, color2, threshold = 10) {
  const distance = calculateEuclideanDistance(color1, color2);
  return distance <= threshold;
}

function removePalettesWithSimilarColors(palette) {
  const uniqueColoredPalettes = [];
  const removedColoredPalettes = [];

  const paletteValues = Object.values(palette);

  // Loop over each palette and check if any of its colors are similar
  paletteValues.forEach((currentPalette, index) => {
    let isPaletteRemoved = false;

    // Compare each color in the current palette with every other color in the same palette
    for (let i = 0; i < currentPalette.length; i++) {
      for (let j = i + 1; j < currentPalette.length; j++) {
        if (areColorsSimilar(currentPalette[i], currentPalette[j])) {
          isPaletteRemoved = true;
          break;
        }
      }
      if (isPaletteRemoved) break;
    }

    // If no similar colors were found, keep the palette, otherwise remove it
    if (isPaletteRemoved) {
      const paletteName = Object.keys(palette)[index];
      removedColoredPalettes.push({ [paletteName]: currentPalette });
    } else {
        uniqueColoredPalettes.push(currentPalette);
    }
  });
console.log("uniquePalettes123",uniqueColoredPalettes)
  return { uniqueColoredPalettes, removedColoredPalettes };
}

