import { storage } from './storage';

// Inicializar dados mockados
export const initializeMockData = () => {
  // Verificar se já existe dados
  if (storage.getUsers().length > 0) {
    return;
  }

  // Usuários de exemplo
  const users = [
    {
      id: '1',
      name: 'Admin Sistema',
      email: 'admin@onix.com',
      password: 'admin123',
      role: 'admin',
      unit: null,
      phone: '(11) 99999-9999',
      cpf: '123.456.789-00',
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: '2',
      name: 'João Silva',
      email: 'joao@email.com',
      password: '123456',
      role: 'resident',
      unit: '101',
      phone: '(11) 98888-8888',
      cpf: '987.654.321-00',
      createdAt: '2024-01-15T00:00:00.000Z'
    },
    {
      id: '3',
      name: 'Maria Santos',
      email: 'maria@email.com',
      password: '123456',
      role: 'resident',
      unit: '202',
      phone: '(11) 97777-7777',
      cpf: '456.789.123-00',
      createdAt: '2024-02-01T00:00:00.000Z'
    }
  ];

  // Unidades
  const units = [
    { id: '1', number: '101', block: 'A', floor: '1', ownerId: '2', ownerName: 'João Silva' },
    { id: '2', number: '102', block: 'A', floor: '1', ownerId: null, ownerName: null },
    { id: '3', number: '201', block: 'A', floor: '2', ownerId: null, ownerName: null },
    { id: '4', number: '202', block: 'A', floor: '2', ownerId: '3', ownerName: 'Maria Santos' },
    { id: '5', number: '301', block: 'A', floor: '3', ownerId: null, ownerName: null },
    { id: '6', number: '101', block: 'B', floor: '1', ownerId: null, ownerName: null },
    { id: '7', number: '102', block: 'B', floor: '1', ownerId: null, ownerName: null },
    { id: '8', number: '201', block: 'B', floor: '2', ownerId: null, ownerName: null },
  ];

  // Boletos
  const bills = [
    {
      id: '1',
      userId: '2',
      type: 'condominium',
      description: 'Condomínio - Janeiro 2026',
      amount: 850.00,
      dueDate: '2026-01-10',
      status: 'overdue',
      barcode: '23793.38128 60000.123456 78901.234567 8 12345678901234',
      competence: '2026-01'
    },
    {
      id: '2',
      userId: '2',
      type: 'condominium',
      description: 'Condomínio - Fevereiro 2026',
      amount: 850.00,
      dueDate: '2026-02-10',
      status: 'pending',
      barcode: '23793.38128 60000.123456 78901.234567 8 12345678901235',
      competence: '2026-02'
    },
    {
      id: '3',
      userId: '2',
      type: 'water',
      description: 'Água - Janeiro 2026',
      amount: 120.50,
      dueDate: '2026-01-15',
      status: 'paid',
      paidAt: '2026-01-14T10:30:00.000Z',
      barcode: '23793.38128 60000.654321 12345.678901 2 98765432109876',
      competence: '2026-01'
    },
    {
      id: '4',
      userId: '3',
      type: 'condominium',
      description: 'Condomínio - Janeiro 2026',
      amount: 950.00,
      dueDate: '2026-01-10',
      status: 'paid',
      paidAt: '2026-01-08T14:20:00.000Z',
      barcode: '23793.38128 60000.789012 34567.890123 4 56789012345678',
      competence: '2026-01'
    },
    {
      id: '5',
      userId: '3',
      type: 'condominium',
      description: 'Condomínio - Fevereiro 2026',
      amount: 950.00,
      dueDate: '2026-02-10',
      status: 'pending',
      barcode: '23793.38128 60000.789012 34567.890123 4 56789012345679',
      competence: '2026-02'
    }
  ];

  // Reservas do salão
  const bookings = [
    {
      id: '1',
      userId: '2',
      userName: 'João Silva',
      unit: '101',
      date: '2026-01-25',
      startTime: '14:00',
      endTime: '18:00',
      event: 'Aniversário',
      guests: 30,
      status: 'approved',
      createdAt: '2026-01-10T10:00:00.000Z'
    },
    {
      id: '2',
      userId: '3',
      userName: 'Maria Santos',
      unit: '202',
      date: '2026-02-14',
      startTime: '19:00',
      endTime: '23:00',
      event: 'Confraternização',
      guests: 25,
      status: 'pending',
      createdAt: '2026-01-18T15:30:00.000Z'
    }
  ];

  // Avisos
  const notices = [
    {
      id: '1',
      title: 'Manutenção do Elevador',
      content: 'Informamos que no dia 25/01/2026 o elevador passará por manutenção preventiva das 8h às 12h. Pedimos a compreensão de todos.',
      author: 'Administração',
      authorId: '1',
      category: 'maintenance',
      priority: 'high',
      createdAt: '2026-01-15T09:00:00.000Z',
      isPinned: true
    },
    {
      id: '2',
      title: 'Assembleia Ordinária',
      content: 'Fica convocada assembleia ordinária para o dia 10/02/2026 às 19h no salão de festas. Pauta: aprovação de contas e eleição do síndico.',
      author: 'Administração',
      authorId: '1',
      category: 'meeting',
      priority: 'high',
      createdAt: '2026-01-12T14:30:00.000Z',
      isPinned: true
    },
    {
      id: '3',
      title: 'Nova Regra de Uso da Churrasqueira',
      content: 'A partir de fevereiro, o uso da churrasqueira deverá ser agendado com antecedência mínima de 48h. Favor entrar em contato com a portaria.',
      author: 'Administração',
      authorId: '1',
      category: 'rules',
      priority: 'medium',
      createdAt: '2026-01-10T11:00:00.000Z',
      isPinned: false
    },
    {
      id: '4',
      title: 'Coleta Seletiva',
      content: 'Lembramos que a coleta seletiva acontece às terças e quintas-feiras. Por favor, separe corretamente seu lixo reciclável.',
      author: 'Admin Sistema',
      authorId: '1',
      category: 'info',
      priority: 'low',
      createdAt: '2026-01-05T08:00:00.000Z',
      isPinned: false
    }
  ];

  // Salvar no localStorage
  storage.setUsers(users);
  storage.setUnits(units);
  storage.setBills(bills);
  storage.setBookings(bookings);
  storage.setNotices(notices);

  console.log('✅ Dados mockados inicializados com sucesso!');
};
