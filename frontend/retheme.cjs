const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

const replaceColors = (filePath) => {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js') && !filePath.endsWith('.css') && !filePath.endsWith('.html')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace typical AI colors with a premium Sunset/Coral & Zinc theme
    content = content.replace(/indigo/g, 'rose');
    content = content.replace(/violet/g, 'fuchsia');
    content = content.replace(/teal/g, 'amber');
    content = content.replace(/slate/g, 'zinc');
    content = content.replace(/green/g, 'emerald'); // softer than harsh green
    content = content.replace(/blue/g, 'rose');
    
    // Refine Framer Motion animations to be "smoother" (springs instead of ease)
    // E.g. replace transition={{ duration: 0.8 }} with transition={{ type: "spring", stiffness: 100, damping: 20 }}
    content = content.replace(/transition=\{\{ duration: [0-9.]+ \}\}/g, 'transition={{ type: "spring", stiffness: 100, damping: 20 }}');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated theme in: ' + filePath);
};

walk(path.join(__dirname, 'src'), (err, results) => {
    if (err) throw err;
    results.forEach(replaceColors);
});

// Update tailwind.config.js to include these new colors if they were customized
const twPath = path.join(__dirname, 'tailwind.config.js');
if (fs.existsSync(twPath)) {
    let tw = fs.readFileSync(twPath, 'utf8');
    tw = tw.replace(/indigo/g, 'rose');
    tw = tw.replace(/teal/g, 'amber');
    tw = tw.replace(/slate/g, 'zinc');
    fs.writeFileSync(twPath, tw, 'utf8');
    console.log('Updated tailwind.config.js');
}

// Update App.jsx toast options
const appPath = path.join(__dirname, 'src/App.jsx');
if (fs.existsSync(appPath)) {
    let app = fs.readFileSync(appPath, 'utf8');
    app = app.replace(/className: 'dark:bg-zinc-800/, "className: 'dark:bg-zinc-900 border-none shadow-2xl");
    fs.writeFileSync(appPath, app, 'utf8');
}
