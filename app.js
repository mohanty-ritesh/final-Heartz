const express = require("express");
const path = require("path");
const app = express();
const User = require('./static/models/userdb');
const ThemeInf = require('./static/models/themes');
const SongInf = require('./static/models/songs');
const port = 4000;
const bodyParser = require('body-parser');
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

const albumname = "";
// to fetch songsinfo and to render it in play.pug container 2's songinfo
app.get('/api/:theme', async (req, res) => {
  const themeName = req.params.theme;
  try {
    const songinfs = await SongInf.find({theme:themeName});
    res.status(200).json(songinfs);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching songinfs' });
  }
});

// Set the views directory and template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'static')));


//all the routes
// for register
app.get('/register', (req, res) => {
  res.status(200).render('register');
});

// for login as first by default page
app.get('/', (req, res) => {
  res.status(200).render('login');
});

app.post('/register', async (req, res) => {
  const { name, password } = req.body;

  try {
    const newUser = new User({ name, password });
    await newUser.save();
    res.redirect('/');
  } catch (err) {
    console.error('Error saving user:', err.message);
    res.status(500).send('Error registering user');
  }
});

// for home render theme landing page
app.get('/home', async (req, res) => {
  try {
    const themesData = await ThemeInf.find();
    res.status(200).render('theme', { themes: themesData });
  } catch (err) {
    console.error('Error fetching themes:', err.message);
    res.status(500).send('Error fetching themes');
  }
});
// for login to get data from from and save in db
app.post('/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    const user = await User.findOne({ name });

    if (!user) {
      return res.status(404).send('User not found');
    }

    if (user.password !== password) {
      return res.status(401).send('Invalid password');
    }

    res.redirect('/home');
  } catch (err) {
    console.error('Error logging in:', err.message);
    res.status(500).send('Error logging in');
  }
});

// for adding theme
app.get('/addthemes', (req, res) => {
  res.status(200).render('addtheme');
});
// for add new theme from add theme form
app.post('/addthemes', async (req, res) => {
  try {
    const { name, image, link } = req.body;
    const newTheme = new ThemeInf({ name, image, link });
    await newTheme.save();
    res.redirect('/home');
  } catch (err) {
    console.error('Error saving theme:', err.message);
    res.status(500).send('Error saving theme');
  }
});


// for adding song in each theme from themeinfs link
app.get('/addsong/:theme', async (req, res) => {
  const themeLink = req.params.theme;
  try {
    const themeData = await ThemeInf.findOne({ link: themeLink }); // Fetch the theme data from the database using the theme link
    if (!themeData) {
      return res.status(404).send('Theme not found');
    }
    res.status(200).render('addsong', { theme: themeData }); // Pass the theme data to the addsong.pug template
  } catch (err) {
    console.error('Error fetching theme data:', err.message);
    res.status(500).send('Error fetching theme data');
  }
});

// Route to handle form submission and add a new song to the database
app.post("/addsong/:theme", (req, res) => {
  const themeLink = req.params.theme;
  const { id, name, image, time, releasedate, malesinger, femalesinger, audioUrl } = req.body;

  const newSong = new SongInf({
    id,
    name,
    image,
    time,
    theme: themeLink, // Use the theme link obtained from the URL
    releasedate,
    malesinger,
    femalesinger,
    audioUrl,
  });
  // function to save songs in database 
  newSong.save()
    .then(() => {
      console.log("New song added to the database:", newSong);
      res.redirect(`/${themeLink}`); // Redirect back to the specific theme page using themeLink
    })
    .catch((err) => {
      console.error("Error adding song to the database:", err.message);
      res.status(500).send("Error adding song to the database");
    });
});
// render theme page one by one as theme from themes (database theme)
app.get('/:theme', async (req, res) => {
  const themeName = req.params.theme;
  try {
    const themeData = await ThemeInf.findOne({ link: themeName });

    if (!themeData) {
      res.status(404).send('Theme not found');
      return;
    }

    const songs = await SongInf.find({ theme: themeName }); // Fetch songs for the current theme

    res.status(200).render('play', { songs, albumname: themeData.name, theme: themeData }); // Pass the theme object
  } catch (err) {
    console.error('Error fetching theme data:', err.message);
    res.status(500).send('Error fetching theme data');
  }
});
// to remove the song by its id 
app.post('/remove-song/:id', async (req, res) => {
  const songId = req.params.id;
  try {
    // Find the song by its id and remove it from the database
    await SongInf.findByIdAndRemove(songId);
    res.redirect(req.get('referer')); // Redirect back to the same page after removal
  } catch (err) {
    console.error('Error removing song:', err.message);
    res.status(500).send('Error removing song');
  }
});

// Listen to the port
app.listen(port, () => {
  console.log(`app is listening on port ${port}`);
});

