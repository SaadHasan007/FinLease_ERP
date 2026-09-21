"""AI Service for handling credit scoring and forecasting."""

from uuid import UUID
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.ml.credit_scoring import CreditScoringModel
from app.ml.cash_flow import CashFlowForecaster
from app.models.application import FinanceApplication as Application
from app.models.customer import Customer
from app.models.payment import PaymentSchedule as Payment

class AIService:
    """Service handling interactions with AI/ML models."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.credit_model = CreditScoringModel()
        self.cash_flow_forecaster = CashFlowForecaster()

    async def assess_credit_risk(self, application_id: UUID) -> Dict[str, Any]:
        """Assess credit risk for a specific application."""
        query = select(Application).where(Application.id == application_id)
        result = await self.session.execute(query)
        application = result.scalar_one_or_none()
        
        if not application:
            raise ValueError(f"Application {application_id} not found")
            
        customer_query = select(Customer).where(Customer.id == application.customer_id)
        customer_result = await self.session.execute(customer_query)
        customer = customer_result.scalar_one_or_none()
        
        if not customer:
            raise ValueError(f"Customer for application {application_id} not found")
            
        app_data = {"amount": float(getattr(application, 'requested_amount', 10000.0) or 10000.0)}
        cust_data = {"income": 60000.0} 
        
        prob_default, shap_values = self.credit_model.predict(app_data, cust_data)
        
        score = int((1.0 - prob_default) * 1000) 
        
        return {
            "application_id": str(application_id),
            "probability_of_default": prob_default,
            "credit_score": score,
            "shap_values": shap_values,
            "risk_level": "HIGH" if prob_default > 0.3 else ("MEDIUM" if prob_default > 0.1 else "LOW")
        }

    async def forecast_cash_flows(self) -> List[Dict[str, Any]]:
        """Forecast cash flows based on historical payments."""
        query = select(Payment).limit(100)
        result = await self.session.execute(query)
        payments = result.scalars().all()
        
        historical_data = [{"amount": getattr(p, "total_amount", 1000.0), "date": getattr(p, "due_date", None)} for p in payments]
        
        forecast = self.cash_flow_forecaster.forecast(historical_data)
        return forecast

