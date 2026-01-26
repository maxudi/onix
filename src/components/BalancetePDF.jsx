import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica', color: '#333' },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#0055ff', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', color: '#0055ff' },
  subtitle: { fontSize: 10, color: '#666', marginTop: 2 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  summaryBox: { 
    flex: 1, 
    padding: 8, 
    backgroundColor: '#f8f9fa', 
    borderWidth: 1,      // Corrigido de border: 1
    borderStyle: 'solid', // Adicionado estilo explícito
    borderColor: '#eeeeee', 
    borderRadius: 4,
    marginRight: 5
  },
  summaryLabel: { fontSize: 8, color: '#888888', textTransform: 'uppercase', marginBottom: 2 },
  summaryValue: { fontSize: 11, fontWeight: 'bold' },
  table: { display: 'table', width: '100%', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0055ff', color: '#ffffff', fontWeight: 'bold', padding: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eeeeee', padding: 6 },
  colData: { width: '20%' },
  colDesc: { width: '50%' },
  colValue: { width: '15%', textAlign: 'right' },
  patrimonioSection: { 
    marginTop: 10, 
    padding: 10, 
    backgroundColor: '#eef4ff', 
    borderRadius: 4, 
    borderLeftWidth: 4, 
    borderLeftColor: '#0055ff' 
  },
  patrimonioRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalGeral: { borderTopWidth: 1, borderTopColor: '#0055ff', marginTop: 5, paddingTop: 5, fontSize: 12, fontWeight: 'bold', color: '#0055ff' }
});

const formatCurrency = (val) => 
  Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const BalancetePDF = ({ mes, ano, saldoAnterior, saldoCorrente, saldoInvestimento, lancamentos }) => {
  const safeLancamentos = Array.isArray(lancamentos) ? lancamentos : [];
  
  const totalCreditos = safeLancamentos.reduce((acc, l) => acc + (Number(l.credito) || 0), 0);
  const totalDebitos = safeLancamentos.reduce((acc, l) => acc + (Number(l.debito) || 0), 0);
  const patrimonioTotal = (Number(saldoCorrente) || 0) + (Number(saldoInvestimento) || 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Demonstrativo Financeiro Mensal</Text>
          <Text style={styles.subtitle}>Referência: {mes} / {ano}</Text>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Saldo Inicial</Text>
            <Text style={styles.summaryValue}>{formatCurrency(saldoAnterior)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={[styles.summaryLabel, { color: '#2e7d32' }]}>Entradas</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalCreditos)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={[styles.summaryLabel, { color: '#d32f2f' }]}>Saídas</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalDebitos)}</Text>
          </View>
          <View style={[styles.summaryBox, { marginRight: 0 }]}>
            <Text style={styles.summaryLabel}>Saldo em Conta</Text>
            <Text style={styles.summaryValue}>{formatCurrency(saldoCorrente)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colData}>Data</Text>
            <Text style={styles.colDesc}>Descrição</Text>
            <Text style={styles.colValue}>Crédito</Text>
            <Text style={styles.colValue}>Débito</Text>
          </View>
          {safeLancamentos.map((l, i) => (
            <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9f9f9' }]}>
              <Text style={styles.colData}>{l.data}</Text>
              <Text style={styles.colDesc}>{l.descricao}</Text>
              <Text style={[styles.colValue, { color: '#2e7d32' }]}>{l.credito ? formatCurrency(l.credito) : '-'}</Text>
              <Text style={[styles.colValue, { color: '#d32f2f' }]}>{l.debito ? formatCurrency(l.debito) : '-'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.patrimonioSection}>
          <View style={styles.patrimonioRow}>
            <Text>Saldo Conta Corrente:</Text>
            <Text>{formatCurrency(saldoCorrente)}</Text>
          </View>
          <View style={styles.patrimonioRow}>
            <Text>Saldo Investimentos:</Text>
            <Text>{formatCurrency(saldoInvestimento)}</Text>
          </View>
          <View style={[styles.patrimonioRow, styles.totalGeral]}>
            <Text>PATRIMÔNIO TOTAL:</Text>
            <Text>{formatCurrency(patrimonioTotal)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default BalancetePDF;