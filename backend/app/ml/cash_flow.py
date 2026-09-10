"""Cash flow forecasting model mock."""

from typing import List, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import random


class CashFlowForecaster:
    """Mock Prophet Cash Flow Forecasting Model."""

    def __init__(self) -> None:
        pass

    def forecast(self, historical_cash_flows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Mock Prophet predictions for the next 12 months.
        
        Args:
            historical_cash_flows: List of past cash flows.
            
        Returns:
            List of forecasted cash flows for the next 12 months.
        """
        forecast_results = []
        base_amount = Decimal("50000.00")
        
        if historical_cash_flows:
            amounts = [cf.get("amount", Decimal("0")) for cf in historical_cash_flows if "amount" in cf]
            if amounts:
                base_amount = sum(amounts) / Decimal(str(len(amounts)))
        
        current_date = datetime.now()
        
        for i in range(1, 13):
            future_date = current_date + timedelta(days=30 * i)
            variance = Decimal(str(random.uniform(-0.1, 0.1)))
            amount = base_amount * (Decimal("1") + variance)
            
            forecast_results.append({
                "month": future_date.strftime("%Y-%m"),
                "expected_inflow": round(amount, 2),
                "expected_outflow": round(amount * Decimal("0.4"), 2),
                "net_cash_flow": round(amount * Decimal("0.6"), 2)
            })
            
        return forecast_results
