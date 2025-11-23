import { apiClient } from '../api-client';
import {
  InventoryTransaction,
  InventoryTransactionCreate,
  InventoryTransactionUpdate,
  InventoryTransactionListResponse,
  InventoryTransactionFilters,
} from '../types';

// Inventory Transactions API
export const inventoryTransactionsApi = {
  // List inventory transactions with pagination and filtering
  getTransactions: async (filters: InventoryTransactionFilters = {}): Promise<InventoryTransactionListResponse> => {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page_size', filters.pageSize.toString());
    if (filters.transactionType) params.append('transactionType', filters.transactionType);
    if (filters.referenceType) params.append('referenceType', filters.referenceType);
    if (filters.sparePartId) params.append('sparePartId', filters.sparePartId.toString());
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);
    if (filters.performedBy) params.append('performedBy', filters.performedBy.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sort_by', filters.sortBy);
    if (filters.sortOrder) params.append('sort_order', filters.sortOrder);

    const response = await apiClient.get(`/inventory-transactions?${params.toString()}`);
    return response.data;
  },

  // Get transaction by ID
  getTransaction: async (transactionId: number): Promise<InventoryTransaction> => {
    const response = await apiClient.get(`/inventory-transactions/${transactionId}`);
    return response.data;
  },

  // Create new transaction
  createTransaction: async (transactionData: InventoryTransactionCreate): Promise<InventoryTransaction> => {
    const response = await apiClient.post('/inventory-transactions', transactionData);
    return response.data;
  },
};

