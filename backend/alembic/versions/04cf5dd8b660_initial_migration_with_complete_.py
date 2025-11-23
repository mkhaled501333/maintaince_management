"""Initial migration with complete database schema

Revision ID: 04cf5dd8b660
Revises: 
Create Date: 2025-10-26 15:26:00.314926

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '04cf5dd8b660'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


"""Initial migration with complete database schema

Revision ID: 04cf5dd8b660
Revises: 
Create Date: 2025-10-26 15:26:00.314926

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '04cf5dd8b660'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create departments table
    op.create_table('departments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_departments_id'), 'departments', ['id'], unique=False)
    op.create_index(op.f('ix_departments_name'), 'departments', ['name'], unique=True)

    # Create users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('fullName', sa.String(length=100), nullable=False),
        sa.Column('hashedPassword', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('ADMIN', 'SUPERVISOR', 'MAINTENANCE_TECH', 'MAINTENANCE_MANAGER', 'INVENTORY_MANAGER', name='userrole'), nullable=False),
        sa.Column('isActive', sa.Boolean(), nullable=False),
        sa.Column('departmentId', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['departmentId'], ['departments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # Create machines table
    op.create_table('machines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('model', sa.String(length=100), nullable=True),
        sa.Column('serialNumber', sa.String(length=100), nullable=True),
        sa.Column('qrCode', sa.String(length=255), nullable=True),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=False),
        sa.Column('lastMaintenanceDate', sa.DateTime(timezone=True), nullable=True),
        sa.Column('nextMaintenanceDate', sa.DateTime(timezone=True), nullable=True),
        sa.Column('departmentId', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['departmentId'], ['departments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_machines_id'), 'machines', ['id'], unique=False)
    op.create_index(op.f('ix_machines_serialNumber'), 'machines', ['serialNumber'], unique=True)
    op.create_index(op.f('ix_machines_qrCode'), 'machines', ['qrCode'], unique=True)

    # Create failurecodes table
    op.create_table('failurecodes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('code', sa.String(length=20), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_failurecodes_id'), 'failurecodes', ['id'], unique=False)
    op.create_index(op.f('ix_failurecodes_code'), 'failurecodes', ['code'], unique=True)

    # Create maintenancetypes table
    op.create_table('maintenancetypes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenancetypes_id'), 'maintenancetypes', ['id'], unique=False)
    op.create_index(op.f('ix_maintenancetypes_name'), 'maintenancetypes', ['name'], unique=True)

    # Create spareparts table
    op.create_table('spareparts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('partNumber', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('currentStock', sa.Integer(), nullable=False),
        sa.Column('minimumStock', sa.Integer(), nullable=False),
        sa.Column('maximumStock', sa.Integer(), nullable=True),
        sa.Column('unitPrice', sa.Float(), nullable=True),
        sa.Column('supplier', sa.String(length=200), nullable=True),
        sa.Column('supplierPartNumber', sa.String(length=100), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_spareparts_id'), 'spareparts', ['id'], unique=False)
    op.create_index(op.f('ix_spareparts_partNumber'), 'spareparts', ['partNumber'], unique=True)

    # Create maintenance_requests table
    op.create_table('maintenance_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='requestpriority'), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', name='requeststatus'), nullable=False),
        sa.Column('requestedDate', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expectedCompletionDate', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actualCompletionDate', sa.DateTime(timezone=True), nullable=True),
        sa.Column('machineId', sa.Integer(), nullable=False),
        sa.Column('requestedById', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['machineId'], ['machines.id'], ),
        sa.ForeignKeyConstraint(['requestedById'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_requests_id'), 'maintenance_requests', ['id'], unique=False)

    # Create maintenance_works table
    op.create_table('maintenance_works',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('workDescription', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED', name='workstatus'), nullable=False),
        sa.Column('startTime', sa.DateTime(timezone=True), nullable=True),
        sa.Column('endTime', sa.DateTime(timezone=True), nullable=True),
        sa.Column('estimatedHours', sa.Float(), nullable=True),
        sa.Column('actualHours', sa.Float(), nullable=True),
        sa.Column('laborCost', sa.Float(), nullable=True),
        sa.Column('materialCost', sa.Float(), nullable=True),
        sa.Column('totalCost', sa.Float(), nullable=True),
        sa.Column('requestId', sa.Integer(), nullable=False),
        sa.Column('machineId', sa.Integer(), nullable=False),
        sa.Column('assignedToId', sa.Integer(), nullable=False),
        sa.Column('failureCodeId', sa.Integer(), nullable=True),
        sa.Column('maintenanceTypeId', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['assignedToId'], ['users.id'], ),
        sa.ForeignKeyConstraint(['failureCodeId'], ['failurecodes.id'], ),
        sa.ForeignKeyConstraint(['maintenanceTypeId'], ['maintenancetypes.id'], ),
        sa.ForeignKeyConstraint(['machineId'], ['machines.id'], ),
        sa.ForeignKeyConstraint(['requestId'], ['maintenance_requests.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_maintenance_works_id'), 'maintenance_works', ['id'], unique=False)

    # Create inventory_transactions table
    op.create_table('inventory_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('transactionType', sa.Enum('IN', 'OUT', 'ADJUSTMENT', 'TRANSFER', name='transactiontype'), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unitPrice', sa.Float(), nullable=True),
        sa.Column('totalValue', sa.Float(), nullable=True),
        sa.Column('referenceNumber', sa.String(length=100), nullable=True),
        sa.Column('referenceType', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('transactionDate', sa.DateTime(timezone=True), nullable=False),
        sa.Column('sparePartId', sa.Integer(), nullable=False),
        sa.Column('performedById', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['performedById'], ['users.id'], ),
        sa.ForeignKeyConstraint(['sparePartId'], ['spareparts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_transactions_id'), 'inventory_transactions', ['id'], unique=False)

    # Create attachments table
    op.create_table('attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('fileName', sa.String(length=255), nullable=False),
        sa.Column('originalFileName', sa.String(length=255), nullable=False),
        sa.Column('filePath', sa.String(length=500), nullable=False),
        sa.Column('fileSize', sa.Integer(), nullable=False),
        sa.Column('mimeType', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('entityType', sa.String(length=50), nullable=False),
        sa.Column('entityId', sa.Integer(), nullable=False),
        sa.Column('uploadedById', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['uploadedById'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_attachments_id'), 'attachments', ['id'], unique=False)

    # Create machine_spareparts table
    op.create_table('machine_spareparts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('machineId', sa.Integer(), nullable=False),
        sa.Column('sparePartId', sa.Integer(), nullable=False),
        sa.Column('quantityRequired', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['machineId'], ['machines.id'], ),
        sa.ForeignKeyConstraint(['sparePartId'], ['spareparts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_machine_spareparts_id'), 'machine_spareparts', ['id'], unique=False)

    # Create machine_downtimes table
    op.create_table('machine_downtimes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('startTime', sa.DateTime(timezone=True), nullable=False),
        sa.Column('endTime', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('productionLoss', sa.Float(), nullable=True),
        sa.Column('costImpact', sa.Float(), nullable=True),
        sa.Column('machineId', sa.Integer(), nullable=False),
        sa.Column('maintenanceWorkId', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['machineId'], ['machines.id'], ),
        sa.ForeignKeyConstraint(['maintenanceWorkId'], ['maintenance_works.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_machine_downtimes_id'), 'machine_downtimes', ['id'], unique=False)

    # Create activity_logs table
    op.create_table('activity_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entityType', sa.String(length=50), nullable=False),
        sa.Column('entityId', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('oldValues', sa.Text(), nullable=True),
        sa.Column('newValues', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('userId', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['userId'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_activity_logs_id'), 'activity_logs', ['id'], unique=False)

    # Create preventive_maintenance_tasks table
    op.create_table('preventive_maintenance_tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('taskName', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('frequencyDays', sa.Integer(), nullable=False),
        sa.Column('estimatedHours', sa.Float(), nullable=True),
        sa.Column('lastPerformedDate', sa.DateTime(timezone=True), nullable=True),
        sa.Column('nextDueDate', sa.DateTime(timezone=True), nullable=True),
        sa.Column('isActive', sa.Boolean(), nullable=False),
        sa.Column('machineId', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['machineId'], ['machines.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_preventive_maintenance_tasks_id'), 'preventive_maintenance_tasks', ['id'], unique=False)

    # Create preventive_maintenance_logs table
    op.create_table('preventive_maintenance_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('createdAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updatedAt', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('performedDate', sa.DateTime(timezone=True), nullable=False),
        sa.Column('actualHours', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('isCompleted', sa.Boolean(), nullable=False),
        sa.Column('taskId', sa.Integer(), nullable=False),
        sa.Column('machineId', sa.Integer(), nullable=False),
        sa.Column('performedById', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['machineId'], ['machines.id'], ),
        sa.ForeignKeyConstraint(['performedById'], ['users.id'], ),
        sa.ForeignKeyConstraint(['taskId'], ['preventive_maintenance_tasks.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_preventive_maintenance_logs_id'), 'preventive_maintenance_logs', ['id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_preventive_maintenance_logs_id'), table_name='preventive_maintenance_logs')
    op.drop_table('preventive_maintenance_logs')
    op.drop_index(op.f('ix_preventive_maintenance_tasks_id'), table_name='preventive_maintenance_tasks')
    op.drop_table('preventive_maintenance_tasks')
    op.drop_index(op.f('ix_activity_logs_id'), table_name='activity_logs')
    op.drop_table('activity_logs')
    op.drop_index(op.f('ix_machine_downtimes_id'), table_name='machine_downtimes')
    op.drop_table('machine_downtimes')
    op.drop_index(op.f('ix_machine_spareparts_id'), table_name='machine_spareparts')
    op.drop_table('machine_spareparts')
    op.drop_index(op.f('ix_attachments_id'), table_name='attachments')
    op.drop_table('attachments')
    op.drop_index(op.f('ix_inventory_transactions_id'), table_name='inventory_transactions')
    op.drop_table('inventory_transactions')
    op.drop_index(op.f('ix_maintenance_works_id'), table_name='maintenance_works')
    op.drop_table('maintenance_works')
    op.drop_index(op.f('ix_maintenance_requests_id'), table_name='maintenance_requests')
    op.drop_table('maintenance_requests')
    op.drop_index(op.f('ix_spareparts_partNumber'), table_name='spareparts')
    op.drop_index(op.f('ix_spareparts_id'), table_name='spareparts')
    op.drop_table('spareparts')
    op.drop_index(op.f('ix_maintenancetypes_name'), table_name='maintenancetypes')
    op.drop_index(op.f('ix_maintenancetypes_id'), table_name='maintenancetypes')
    op.drop_table('maintenancetypes')
    op.drop_index(op.f('ix_failurecodes_code'), table_name='failurecodes')
    op.drop_index(op.f('ix_failurecodes_id'), table_name='failurecodes')
    op.drop_table('failurecodes')
    op.drop_index(op.f('ix_machines_qrCode'), table_name='machines')
    op.drop_index(op.f('ix_machines_serialNumber'), table_name='machines')
    op.drop_index(op.f('ix_machines_id'), table_name='machines')
    op.drop_table('machines')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_departments_name'), table_name='departments')
    op.drop_index(op.f('ix_departments_id'), table_name='departments')
    op.drop_table('departments')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS userrole')
    op.execute('DROP TYPE IF EXISTS requestpriority')
    op.execute('DROP TYPE IF EXISTS requeststatus')
    op.execute('DROP TYPE IF EXISTS workstatus')
    op.execute('DROP TYPE IF EXISTS transactiontype')
