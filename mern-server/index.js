const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const natural = require('natural');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mern-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDB:', error);
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Models
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
});

const documentSchema = new mongoose.Schema({
  filename: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
});

const User = mongoose.model('User', userSchema);
const Document = mongoose.model('Document', documentSchema);

// Routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).send({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send({ message: 'Error registering user' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      res.status(200).send({ userId: user._id });
    } else {
      res.status(401).send({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send({ message: 'Error logging in' });
  }
});

app.post('/upload', upload.single('document'), async (req, res) => {
  const { userId } = req.body;
  const { filename } = req.file;

  try {
    const filePath = path.join(__dirname, 'uploads', filename);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);

    const newDocument = new Document({ filename, uploadedBy: userId, content: pdfData.text });
    await newDocument.save();
    res.status(201).send({ message: 'Document uploaded successfully' });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).send({ message: 'Error uploading document' });
  }
});

app.get('/documents/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const documents = await Document.find({ uploadedBy: userId });
    res.status(200).send({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).send({ message: 'Error fetching documents' });
  }
});

app.get('/documents/:userId/:docId', async (req, res) => {
  const { userId, docId } = req.params;

  try {
    const document = await Document.findOne({ _id: docId, uploadedBy: userId });
    if (document) {
      res.status(200).send({ document });
    } else {
      res.status(404).send({ message: 'Document not found' });
    }
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).send({ message: 'Error fetching document' });
  }
});

app.post('/questions', async (req, res) => {
  const { userId, docId, question } = req.body;

  try {
    const document = await Document.findById(docId);
    if (!document || document.uploadedBy.toString() !== userId) {
      return res.status(404).send({ message: 'Document not found' });
    }

    const answer = await processQuestionWithNLPService(document.content, question);
    res.status(200).send({ answer });
  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).send({ message: 'Error processing question' });
  }
});

const processQuestionWithNLPService = async (documentContent, question) => {
  try {
    console.log('Processing question with NLP service');
    console.log('Document content:', documentContent);
    console.log('Question:', question);

    if (!documentContent || documentContent.trim() === '') {
      console.error('Document content is empty or invalid');
      throw new Error('Document content is empty or invalid');
    }

    const tokenizer = new natural.WordTokenizer();
    const tokenizedContent = tokenizer.tokenize(documentContent);
    const tokenizedQuestion = tokenizer.tokenize(question);

    console.log('Tokenized content:', tokenizedContent);
    console.log('Tokenized question:', tokenizedQuestion);

    if (tokenizedContent.length === 0 || tokenizedQuestion.length === 0) {
      console.error('Tokenization failed, content or question might be empty');
      throw new Error('Tokenization failed, content or question might be empty');
    }

    const Tfidf = natural.TfIdf;
    const tfidf = new Tfidf();
    tfidf.addDocument(documentContent);

    let highestScore = 0;
    let bestSentence = '';

    documentContent.split('.').forEach((sentence, index) => {
      const score = tfidf.tfidf(tokenizedQuestion.join(' '), index);
      if (score > highestScore) {
        highestScore = score;
        bestSentence = sentence;
      }
    });

    console.log('Best sentence:', bestSentence);
    console.log('Highest score:', highestScore);

    if (!bestSentence) {
      console.error('No suitable answer found');
      throw new Error('No suitable answer found');
    }

    return `Answer to the question: "${question}" based on the document content: "${bestSentence}".`;
  } catch (error) {
    console.error('Error in NLP processing:', error);
    throw new Error('Error in NLP processing');
  }
};

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
