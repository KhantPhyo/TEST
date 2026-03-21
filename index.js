let express = require('express');
let app = express();
let ejs = require('ejs');
const port = process.env.PORT || 3000;

const portfolio = {
  name: 'Khant Phyo',
  initials: 'KP',
  tagline: 'Full-Stack Developer crafting clean, scalable web experiences.',

  about: [
    'I\'m a passionate full-stack developer with a love for building products that live on the internet. I enjoy turning complex problems into simple, beautiful, and intuitive solutions.',
    'When I\'m not coding, you\'ll find me exploring new technologies, contributing to open-source projects, or leveling up my skills in system design and cloud architecture.',
  ],

  stats: [
    { value: '3+', label: 'Years Experience' },
    { value: '20+', label: 'Projects Shipped' },
    { value: '10+', label: 'Happy Clients' },
  ],

  skills: [
    {
      category: 'Frontend',
      items: ['React', 'Vue.js', 'TypeScript', 'Tailwind CSS', 'HTML5', 'CSS3'],
    },
    {
      category: 'Backend',
      items: ['Node.js', 'Express', 'Python', 'REST APIs', 'GraphQL'],
    },
    {
      category: 'Database',
      items: ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL'],
    },
    {
      category: 'DevOps & Tools',
      items: ['Docker', 'Git', 'AWS', 'CI/CD', 'Linux', 'Nginx'],
    },
  ],

  projects: [
    {
      icon: '🛒',
      title: 'E-Commerce Platform',
      description: 'A full-featured online store with cart management, Stripe payments, and real-time inventory tracking.',
      tags: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
      github: 'https://github.com/khantphyo',
      demo: null,
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Interactive business intelligence dashboard with dynamic charts, custom date ranges, and CSV export.',
      tags: ['Vue.js', 'Python', 'FastAPI', 'Chart.js'],
      github: 'https://github.com/khantphyo',
      demo: null,
    },
    {
      icon: '💬',
      title: 'Real-Time Chat App',
      description: 'Scalable WebSocket chat application supporting rooms, direct messages, and file attachments.',
      tags: ['React', 'Socket.io', 'Redis', 'MongoDB'],
      github: 'https://github.com/khantphyo',
      demo: null,
    },
    {
      icon: '🤖',
      title: 'AI Content Generator',
      description: 'Web app that leverages Claude API to generate blog posts, social captions, and product descriptions.',
      tags: ['Next.js', 'Claude API', 'TypeScript', 'Tailwind'],
      github: 'https://github.com/khantphyo',
      demo: null,
    },
    {
      icon: '📋',
      title: 'Task Management Tool',
      description: 'Kanban-style project tracker with drag-and-drop, team collaboration, and deadline notifications.',
      tags: ['React', 'Express', 'PostgreSQL', 'Docker'],
      github: 'https://github.com/khantphyo',
      demo: null,
    },
    {
      icon: '🌐',
      title: 'This Portfolio',
      description: 'Clean, responsive portfolio built with Node.js, Express, and EJS — deployed on Azure App Service.',
      tags: ['Node.js', 'Express', 'EJS', 'CSS3'],
      github: 'https://github.com/khantphyo',
      demo: null,
    },
  ],

  contact: {
    intro: 'I\'m always open to interesting projects and new opportunities. Drop me a message and let\'s build something great together.',
    links: [
      { icon: '📧', label: 'Email', value: 'khantphyo@email.com', href: 'mailto:khantphyo@email.com' },
      { icon: '💼', label: 'LinkedIn', value: 'linkedin.com/in/khantphyo', href: 'https://linkedin.com/in/khantphyo' },
      { icon: '🐙', label: 'GitHub', value: 'github.com/khantphyo', href: 'https://github.com/khantphyo' },
      { icon: '🐦', label: 'Twitter', value: '@khantphyo', href: 'https://twitter.com/khantphyo' },
    ],
  },
};

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { portfolio });
});

app.listen(port);
