from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Batch, BatchExpense, MortalityRate, CustomerDetail, BatchSale, InfraExpense

class BatchTestCase(APITestCase):

    def setUp(self):

        self.user = User.objects.create(username = "tester", password = "testpassword") # create a user for authentication
        self.token = Token.objects.create(user=self.user) # create a token for the user
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key) # set the token in the request header for authentication

    def test_cannot_create_batch_with_negative_chicks(self):

        payload = {
            "batch_no" : 1,
            "date" : "2023-01-01",
            "buying_price" : 1000.00,
            "no_of_chicks" : -5   # Arrange negative number of chicks to test validation
        }

        response = self.client.post('/api/batches/', data = payload, format = 'json') # act 
        self.assertEqual(response.status_code,400) # assertion 
