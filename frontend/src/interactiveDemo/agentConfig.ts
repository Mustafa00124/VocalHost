export interface LeftScreen {
  id: string;
  title: string;
  type: 'calendar' | 'crm' | 'shopping' | 'gallery' | 'tickets';
  data: any;
}

export interface AgentConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  background: string;
  leftScreens: LeftScreen[];
  tips: string[];
  phoneAvatar: string;
  phoneName: string;
}

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    id: 'restaurant',
    name: 'Restaurant Agent',
    emoji: '🍽️',
    description: 'Handle reservations and dining inquiries',
    background: '/src/interactiveDemo/backgrounds/restaurant.jpg',
    phoneAvatar: '🍽️',
    phoneName: 'Restaurant Assistant',
    leftScreens: [
      {
        id: 'calendar',
        title: 'Reservation Calendar',
        type: 'calendar',
        data: {
          slots: [
            { time: '6:00 PM', available: true, party: 4 },
            { time: '6:30 PM', available: false, party: 2 },
            { time: '7:00 PM', available: true, party: 6 },
            { time: '7:30 PM', available: true, party: 2 },
            { time: '8:00 PM', available: false, party: 4 },
            { time: '8:30 PM', available: true, party: 8 },
          ],
          today: 'Today, Dec 15',
          restaurant: 'Bella Vista Restaurant'
        }
      }
    ],
    tips: [
      "Try: 'I'd like to make a reservation for 4 people tonight'",
      "Ask: 'What time do you have available for dinner?'",
      "Say: 'I need to cancel my 7:30 reservation'"
    ]
  },
  {
    id: 'salon',
    name: 'Salon Agent',
    emoji: '💇',
    description: 'Book appointments and manage stylist schedules',
    background: '/src/interactiveDemo/backgrounds/salon.jpg',
    phoneAvatar: '💇',
    phoneName: 'Salon Assistant',
    leftScreens: [
      {
        id: 'calendar',
        title: 'Stylist Availability',
        type: 'calendar',
        data: {
          stylists: [
            { name: 'Sarah', specialty: 'Hair Color', available: true },
            { name: 'Mike', specialty: 'Haircuts', available: true },
            { name: 'Emma', specialty: 'Styling', available: false },
          ],
          slots: [
            { time: '10:00 AM', available: true, stylist: 'Sarah' },
            { time: '10:30 AM', available: true, stylist: 'Mike' },
            { time: '11:00 AM', available: false, stylist: 'Emma' },
            { time: '11:30 AM', available: true, stylist: 'Sarah' },
            { time: '2:00 PM', available: true, stylist: 'Mike' },
            { time: '2:30 PM', available: true, stylist: 'Sarah' },
          ],
          today: 'Today, Dec 15',
          salon: 'Style Studio'
        }
      }
    ],
    tips: [
      "Try: 'I need a haircut appointment with Mike'",
      "Ask: 'What services do you offer?'",
      "Say: 'I want to book a color treatment for next week'"
    ]
  },
  {
    id: 'support',
    name: 'Customer Support Agent',
    emoji: '🏦',
    description: 'Handle customer inquiries and support tickets',
    background: '/src/interactiveDemo/backgrounds/techsupport.jpg',
    phoneAvatar: '🏦',
    phoneName: 'Support Assistant',
    leftScreens: [
      {
        id: 'crm',
        title: 'Customer Profile',
        type: 'crm',
        data: {
          customer: {
            name: 'John Smith',
            email: 'john@example.com',
            plan: 'Pro Plan',
            status: 'Active',
            joinDate: 'Jan 2023'
          },
          tickets: [
            { id: 'T-001', subject: 'Billing Question', status: 'Open', priority: 'Medium' },
            { id: 'T-002', subject: 'Feature Request', status: 'Closed', priority: 'Low' },
            { id: 'T-003', subject: 'Login Issue', status: 'In Progress', priority: 'High' },
          ],
          recentActivity: [
            'Logged in 2 hours ago',
            'Updated profile yesterday',
            'Submitted ticket T-001 today'
          ]
        }
      }
    ],
    tips: [
      "Try: 'I have a billing question about my Pro plan'",
      "Ask: 'Can you help me with my login issue?'",
      "Say: 'I want to upgrade my subscription'"
    ]
  },
  {
    id: 'dentist',
    name: 'Dentist Receptionist',
    emoji: '🦷',
    description: 'Manage dental appointments and patient records',
    background: '/src/interactiveDemo/backgrounds/dentist.jpg',
    phoneAvatar: '🦷',
    phoneName: 'Dental Assistant',
    leftScreens: [
      {
        id: 'calendar',
        title: 'Appointment Calendar',
        type: 'calendar',
        data: {
          slots: [
            { time: '9:00 AM', available: true, procedure: 'Cleaning' },
            { time: '9:30 AM', available: false, procedure: 'Filling' },
            { time: '10:00 AM', available: true, procedure: 'Consultation' },
            { time: '10:30 AM', available: true, procedure: 'Cleaning' },
            { time: '2:00 PM', available: false, procedure: 'Root Canal' },
            { time: '2:30 PM', available: true, procedure: 'Cleaning' },
          ],
          today: 'Today, Dec 15',
          practice: 'Bright Smile Dental'
        }
      },
      {
        id: 'crm',
        title: 'Patient Record',
        type: 'crm',
        data: {
          patient: {
            name: 'Maria Garcia',
            dob: '1985-03-15',
            insurance: 'Delta Dental',
            lastVisit: '2024-11-20',
            nextAppointment: '2024-12-15'
          },
          history: [
            { date: '2024-11-20', procedure: 'Regular Cleaning', notes: 'No issues found' },
          ],
          notes: 'Patient prefers morning appointments.'
        }
      }
    ],
    tips: [
      "Try: 'I need to schedule a cleaning appointment'",
      "Ask: 'What are your available times this week?'",
      "Say: 'I need to reschedule my appointment'"
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Assistant',
    emoji: '👕',
    description: 'Help customers with product inquiries and orders',
    background: '/src/interactiveDemo/backgrounds/ecommerce.jpg',
    phoneAvatar: '👕',
    phoneName: 'Shop Assistant',
    leftScreens: [
      {
        id: 'shopping',
        title: 'Product Store',
        type: 'shopping',
        data: {}
      }
    ],
    tips: [
      "Try: 'I'm looking for a blue t-shirt in size large'",
      "Ask: 'What sizes do you have available?'",
      "Say: 'I want to add this to my cart'"
    ]
  }
];

export const getAgentConfig = (agentId: string): AgentConfig | undefined => {
  return AGENT_CONFIGS.find(agent => agent.id === agentId);
};
