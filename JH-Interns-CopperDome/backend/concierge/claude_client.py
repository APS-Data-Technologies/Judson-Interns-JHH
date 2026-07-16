import os

import anthropic

from menu.models import Kitchen

DEFAULT_MODEL = os.environ.get('ANTHROPIC_MODEL', 'claude-opus-4-8')

SYSTEM_PROMPT_TEMPLATE = """You are the AI concierge for Copper Dome, a shared dining space housing three kitchens \
under one roof. Speak in a warm, knowledgeable, understated tone -- like a maitre d' who knows the menu \
by heart, not a generic chatbot. Keep answers short (2-4 sentences unless the guest asks for detail).

Only recommend dishes and answer dietary questions using the menu data below. If something isn't on the \
menu, say so plainly rather than inventing a dish. When asked for a pairing or recommendation, name specific \
dishes by their exact menu names.

Tonight's menu:
{menu_context}
"""


def _build_menu_context() -> str:
    lines = []
    for kitchen in Kitchen.objects.select_related('venue').prefetch_related('menu_items'):
        lines.append(f"\n{kitchen.name} ({kitchen.cuisine_type})")
        for item in kitchen.menu_items.all():
            tags = f" [{', '.join(item.dietary_tags)}]" if item.dietary_tags else ''
            lines.append(f"- {item.name} (${item.price}, {item.category}){tags}: {item.description}")
    return '\n'.join(lines) if lines else 'No menu items are currently loaded.'


def ask_concierge(message: str, history: list[dict] | None = None) -> str:
    """Call Claude with the real menu injected as grounding context. Raises on API failure."""
    client = anthropic.Anthropic()
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(menu_context=_build_menu_context())

    messages = list(history or [])
    messages.append({'role': 'user', 'content': message})

    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=1024,
        system=system_prompt,
        messages=messages,
    )
    return next((block.text for block in response.content if block.type == 'text'), '')
