from decimal import Decimal
from datetime import date, datetime
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Batch, BatchExpense, MortalityRate, CustomerDetail, BatchSale

class FarmAPITests(APITestCase):

    def setUp(self):
        # Setup clean test data for automated testing
        self.customer = CustomerDetail.objects.create(
            customer_id=99,
            customer_name="Test Buyer",
            contact_number="9999999999",
            email="test@buyer.com",
            address="Test Address"
        )
        self.batch = Batch.objects.create(
            batch_no=99,
            date=date(2026, 1, 1),
            buying_price=Decimal("10000.00"),
            no_of_chicks=200
        )
        # Add an expense of 2500
        BatchExpense.objects.create(
            batch=self.batch,
            date=date(2026, 1, 10),
            expense_type="Feed",
            amount=Decimal("2500.00")
        )
        # Add mortality of 8 deaths (4%)
        MortalityRate.objects.create(
            batch=self.batch,
            date=datetime(2026, 1, 15, 10, 0),
            no_of_deaths=8,
            reason_of_death="Transport stress"
        )
        # Add sale of 20000
        BatchSale.objects.create(
            batch=self.batch,
            customer=self.customer,
            date=date(2026, 3, 1),
            no_of_hens=50,
            no_of_roosters=50,
            kg=Decimal("120.00"),
            amount=Decimal("20000.00")
        )

    def test_get_batches_list(self):
        """Test retrieving list of batches"""
        response = self.client.get('/api/batches/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_batch(self):
        """Test creating a new batch via POST"""
        payload = {
            "batch_no": 100,
            "date": "2026-02-01",
            "buying_price": "12000.00",
            "no_of_chicks": 250
        }
        response = self.client.post('/api/batches/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['batch_no'], 100)

    def test_batch_revenue_action(self):
        """Test the custom BatchRevenue @action"""
        response = self.client.get(f'/api/batches/{self.batch.batch_no}/BatchRevenue/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(response.data['total_revenue'])), Decimal('20000.00'))

    def test_batch_expense_action(self):
        """Test the custom BatchExpense @action"""
        response = self.client.get(f'/api/batches/{self.batch.batch_no}/BatchExpense/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(response.data['total_expenses'])), Decimal('2500.00'))

    def test_mortality_rate_action(self):
        """Test the custom Mortality_Rate @action"""
        response = self.client.get(f'/api/batches/{self.batch.batch_no}/Mortality_Rate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['no_of_deaths'], 8)
        self.assertEqual(response.data['mortality_rate'], 4.0)
        self.assertEqual(response.data['Remaining_chicks'], 192)

    def test_profit_or_loss_action(self):
        """Test the custom ProfitORLose @action"""
        # Revenue = 20000, Total Cost = 10000 (buying) + 2500 (expense) = 12500
        # Expected Profit = 20000 - 12500 = 7500
        response = self.client.get(f'/api/batches/{self.batch.batch_no}/ProfitORLose/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'Profit')
        self.assertEqual(Decimal(str(response.data['profit_or_loss'])), Decimal('7500.00'))
