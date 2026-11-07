from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Batch, BatchExpense, MortalityRate, CustomerDetail, BatchSale, InfraExpense

class CoopOSTestCase(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="testpassword")
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_cannot_create_batch_with_negative_chicks(self):
        payload = {
            "batch_no": 1,
            "date": "2026-01-01",
            "buying_price": 1000.00,
            "no_of_chicks": -5
        }
        response = self.client.post('/api/batches/', data=payload, format='json')
        self.assertEqual(response.status_code, 400)

    def test_create_batch_and_pnl_calculation(self):
        # 1. Create a batch
        batch_payload = {
            "batch_no": 101,
            "date": "2026-02-01",
            "buying_price": "5000.00",
            "no_of_chicks": 100
        }
        res_batch = self.client.post('/api/batches/', data=batch_payload, format='json')
        self.assertEqual(res_batch.status_code, 201)

        # 2. Add feed expense of 2000
        exp_payload = {
            "batch": 101,
            "date": "2026-02-10",
            "expense_type": "Starter Feed",
            "amount": "2000.00"
        }
        res_exp = self.client.post('/api/batch-expenses/', data=exp_payload, format='json')
        self.assertEqual(res_exp.status_code, 201)

        # 3. Add mortality of 5 chicks
        mort_payload = {
            "batch": 101,
            "date": "2026-02-05T10:00:00Z",
            "no_of_deaths": 5,
            "reason_of_death": "Transport stress"
        }
        res_mort = self.client.post('/api/mortality-rates/', data=mort_payload, format='json')
        self.assertEqual(res_mort.status_code, 201)

        # 4. Add Customer
        cust_payload = {
            "customer_name": "Ravi Hotel",
            "contact_number": "9876543210",
            "email": "ravi@hotel.com",
            "address": "Bazaar Street"
        }
        res_cust = self.client.post('/api/customer-details/', data=cust_payload, format='json')
        self.assertEqual(res_cust.status_code, 201)
        cust_id = res_cust.data['customer_id']

        # 5. Add Sale: 50 hens, 40 roosters, 9000 revenue
        sale_payload = {
            "batch": 101,
            "customer": cust_id,
            "date": "2026-02-25",
            "no_of_hens": 50,
            "no_of_roosters": 40,
            "kg": "120.500",
            "amount": "9000.00"
        }
        res_sale = self.client.post('/api/batch-sales/', data=sale_payload, format='json')
        self.assertEqual(res_sale.status_code, 201)

        # 6. Verify Mortality rate endpoint:
        # Total chicks = 100, Deaths = 5, Sold = 90 -> Remaining = 5 chicks (5% mortality)
        res_mort_check = self.client.get('/api/batches/101/Mortality_Rate/')
        self.assertEqual(res_mort_check.status_code, 200)
        self.assertEqual(res_mort_check.data['Remaining_chicks'], 5)
        self.assertEqual(res_mort_check.data['mortality_rate'], 5.0)

        # 6a. Attempt to record 10 deaths when only 5 remain (must fail 400)
        res_excess = self.client.post('/api/mortality-rates/', data={
            'batch': 101,
            'date': '2026-02-26T10:00:00Z',
            'no_of_deaths': 10,
            'reason_of_death': 'Exceeding remaining'
        }, format='json')
        self.assertEqual(res_excess.status_code, 400)

        # 6b. Attempt to record 0 deaths (must fail 400)
        res_zero = self.client.post('/api/mortality-rates/', data={
            'batch': 101,
            'date': '2026-02-26T10:00:00Z',
            'no_of_deaths': 0,
            'reason_of_death': 'Zero deaths'
        }, format='json')
        self.assertEqual(res_zero.status_code, 400)

        # 7. Verify P&L calculation:
        # Revenue = 9000, Total Expenses = 5000 (chick cost) + 2000 (feed) = 7000
        # Net Profit = 9000 - 7000 = +2000 ("Profit")
        res_pnl = self.client.get('/api/batches/101/ProfitORLose/')
        self.assertEqual(res_pnl.status_code, 200)
        self.assertEqual(float(res_pnl.data['revenue']), 9000.0)
        self.assertEqual(float(res_pnl.data['profit_or_loss']), 2000.0)
        self.assertEqual(res_pnl.data['status'], "Profit")

    def test_infra_expense_crud(self):
        payload = {
            "date": "2026-03-01",
            "expense_type": "EB Electricity Bill",
            "amount": "1450.00"
        }
        res = self.client.post('/api/infra-expenses/', data=payload, format='json')
        self.assertEqual(res.status_code, 201)
        infra_id = res.data['id']

        res_list = self.client.get('/api/infra-expenses/')
        self.assertEqual(res_list.status_code, 200)
        self.assertTrue(any(item['id'] == infra_id for item in res_list.data))

    def test_frontend_index_serves_html(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'id="root"', response.content)
        self.assertIn(b'CoopOS', response.content)

    def test_batch_vaccination_schedule_and_toggle(self):
        # 1. Create a batch
        batch_payload = {
            "batch_no": 202,
            "date": "2026-03-01",
            "buying_price": "8000.00",
            "no_of_chicks": 200
        }
        res_batch = self.client.post('/api/batches/', data=batch_payload, format='json')
        self.assertEqual(res_batch.status_code, 201)

        # 2. Get vaccinations for batch 202 (should auto-generate 10 milestones for 90 days)
        res_vax = self.client.get('/api/batches/202/vaccinations/')
        self.assertEqual(res_vax.status_code, 200)
        self.assertEqual(len(res_vax.data), 10)
        self.assertEqual(res_vax.data[0]['day'], 1)
        self.assertEqual(res_vax.data[0]['is_completed'], False)
        self.assertEqual(res_vax.data[2]['day'], 10)
        self.assertEqual(res_vax.data[9]['day'], 57)
        self.assertIn('0.05 ml', res_vax.data[9]['dosage'])

        # 3. Toggle Day 1 vaccination
        vax_id = res_vax.data[0]['id']
        res_toggle = self.client.post(f'/api/vaccinations/{vax_id}/toggle/')
        self.assertEqual(res_toggle.status_code, 200)
        self.assertEqual(res_toggle.data['is_completed'], True)
        self.assertIsNotNone(res_toggle.data['administered_date'])

        # 4. Untoggle Day 1 vaccination
        res_untoggle = self.client.post(f'/api/vaccinations/{vax_id}/toggle/')
        self.assertEqual(res_untoggle.status_code, 200)
        self.assertEqual(res_untoggle.data['is_completed'], False)
        self.assertIsNone(res_untoggle.data['administered_date'])
