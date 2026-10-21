# assets

## Files you can add

- `photo.jpg` (optional). Shown at the top of the About page's sidebar. Portrait
  orientation works best (it is cropped to 4:5). If the file is missing, nothing
  is shown, so you can publish without it.
- `chroma-demo.mp4` (optional, H.264 plays everywhere) and `chroma-demo.webm`.
  Shown in the Demo section of the Chroma page. Until the file exists, visitors
  see a "Demo video coming soon" placeholder.

## Photo tips

- Phones embed the location a photo was taken in (EXIF data). Strip it before
  uploading: on a Mac, Preview > Tools > Show Inspector > GPS > Remove Location
  Info; on Windows, right-click the file > Properties > Details > Remove
  Properties and Personal Information.
- Around 900px wide is plenty. Keep it under about 300 KB.
- Skip game and anime artwork; it is copyrighted. A photo you took yourself is
  safe. Avoid photos of students.

## Demo video tips

A screen recording is usually far too big for a web page. This shrinks it
(1280px wide, no audio, starts playing quickly):

    ffmpeg -i recording.mov -vf scale=1280:-2 -an -c:v libx264 -crf 28 -movflags +faststart chroma-demo.mp4

Aim for under about 15 MB.

## Already here

- `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`: the circular tab icon
  and its fallbacks.
