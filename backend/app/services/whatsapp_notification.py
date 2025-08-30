# import os
# import json
# from twilio.rest import Client
# from app.models import Booking, Assistant, Conversation

# # 1) Twilio config from env
# TWILIO_ACCOUNT_SID           = os.getenv("TWILIO_ACCOUNT_SID")
# TWILIO_AUTH_TOKEN            = os.getenv("TWILIO_AUTH_TOKEN")
# TWILIO_WHATSAPP_NUMBER       = os.getenv("TWILIO_WHATSAPP_NUMBER")      # "+15557483247"
# TWILIO_WHATSAPP_TEMPLATE_SID = os.getenv("TWILIO_WHATSAPP_TEMPLATE_SID")  # "HXXXXXXXXXXXXXXXX"

# # 2) Initialize Twilio client
# client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


# def send_booking_confirmation(booking_id: int, conversation_id: int = None) -> bool:
#     """
#     Send a WhatsApp booking-confirmation template to the customer.
#     """
#     # Fetch booking & assistant
#     booking = Booking.query.get(booking_id)
#     if not booking:
#         print(f"Error: Booking ID {booking_id} not founad")
#         return False

#     assistant = Assistant.query.get(booking.assistant_id)
#     if not assistant:
#         print(f"Error: Assistant ID {booking.assistant_id} not found")
#         return False

#     # Pull the customer’s phone from the conversation
#     customer_phone = None
#     if conversation_id:
#         convo = Conversation.query.get(conversation_id)
#         if convo:
#             customer_phone = convo.caller_number

#     if not (customer_phone and customer_phone.startswith("+")):
#         print("No valid customer phone number, skipping WhatsApp.")
#         return False

#     # Validate Twilio WhatsApp configuration
#     if not TWILIO_WHATSAPP_NUMBER:
#         print("TWILIO_WHATSAPP_NUMBER not set.")
#         return False
#     if not TWILIO_WHATSAPP_TEMPLATE_SID:
#         print("TWILIO_WHATSAPP_TEMPLATE_SID not set.")
#         return False

#     # Format date/time/details
#     formatted_date = booking.date.strftime("%A, %B %d, %Y")
#     formatted_time = booking.time.strftime("%I:%M %p").lstrip("0")
#     details        = booking.details or "No special requests"
#     customer_name  = booking.customer_name

#     # Build the variables map for your 5 placeholders
#     variables = {
#         "1": assistant.business_name,
#         "2": formatted_date,
#         "3": formatted_time,
#         "4": details,
#         "5": customer_name
#     }

#     # Send the template message
#     try:
#         msg = client.messages.create(
#             from_            = f"whatsapp:{TWILIO_WHATSAPP_NUMBER}",
#             to               = f"whatsapp:{customer_phone}",
#             content_sid       = TWILIO_WHATSAPP_TEMPLATE_SID,
#             content_variables = json.dumps(variables)
#         )
#         print(f"WhatsApp template message SID: {msg.sid}")
#         return True

#     except Exception as e:
#         print(f"Error sending WhatsApp template to customer: {e}")
#         return False
