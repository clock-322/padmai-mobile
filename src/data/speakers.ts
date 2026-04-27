export interface Speaker {
  id: string;
  name: string;
  role: string;
  message: string;
  image: any; // Using any for require() return type
}

export const speakers: Speaker[] = [
  {
    id: 'rafik',
    name: 'Rafik Saudagar',
    role: 'Founder & Chairman',
    message: "I welcome you to my school application. For your child's bright future.",
    image: require('../assets/images/rafik.jpg'),
  },
  {
    id: 'nasir',
    name: 'Nasir Saudagar',
    role: 'Coordinator',
    message: 'We welcome you to our school application. Track your child in one click from your home.',
    image: require('../assets/images/nasir.jpg'),
  },
  {
    id: 'sanjay',
    name: 'Sanjay Sabale',
    role: 'Principal',
    message: 'We welcome you to our school application. We assure you for your child\'s bright future ahead.',
    image: require('../assets/images/sanjay.jpg'),
  },
  {
    id: 'kishor',
    name: 'Kishor Nerkar',
    role: 'App Support',
    message: 'For any help or support, please contact us directly. We are always here to assist you and your family.',
    image: require('../assets/images/sanjay.jpg'),
  },
];

