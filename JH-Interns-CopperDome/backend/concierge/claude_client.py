import os

import anthropic

from menu.models import Kitchen, MenuItem

DEFAULT_MODEL = os.environ.get('ANTHROPIC_MODEL', 'claude-opus-5')

SYSTEM_PROMPT_TEMPLATE = """You are the AI concierge for Copper Dome, a shared dining space housing three kitchens \
under one roof. Speak in a warm, knowledgeable, understated tone -- like a maitre d' who knows the menu \
by heart, not a generic chatbot. Keep answers short (2-4 sentences unless the guest asks for detail).

Only recommend dishes and answer dietary questions using the menu data below. If something isn't on the \
menu, say so plainly rather than inventing a dish. When asked for a pairing or recommendation, name specific \
dishes by their exact menu names.

Dietary tags mean exactly this and nothing more: V = vegetarian, GF = gluten-free, SP = spicy.
These tags are the only dietary information you have. Never infer an allergen, ingredient, or
restriction that is not written in the dish's description or tags -- if a guest asks about
something the menu does not state (nuts, shellfish, dairy, halal, and so on), say you cannot
confirm it and ask them to check with the server, who can speak to the kitchen.

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


def is_stubbed() -> bool:
    """True when no Claude key is configured and answers come from the local fallback."""
    return not os.environ.get('ANTHROPIC_API_KEY')


def _stub_reply(message: str) -> str:
    """Menu-grounded keyword fallback so the concierge flow stays demo-able without a key.

    The trial can still exercise the full patron journey and event instrumentation on a
    machine that has no API key configured; answers stay grounded in the real menu rows.
    """
    lowered = message.lower()
    items = list(MenuItem.objects.select_related('kitchen').all())
    if not items:
        return "The menu isn't loaded yet, so I can't make a recommendation. Please ask your server."

    tag_for_word = {'vegetarian': 'V', 'vegan': 'V', 'gluten': 'GF', 'celiac': 'GF', 'coeliac': 'GF'}
    wanted_tag = next((tag for word, tag in tag_for_word.items() if word in lowered), None)
    if wanted_tag:
        matches = [item for item in items if wanted_tag in item.dietary_tags][:3]
        if matches:
            listed = ', '.join(f"{i.name} from {i.kitchen.name} (${i.price})" for i in matches)
            return f"A few good options for that: {listed}. Happy to narrow it down further."

    words = [word for word in lowered.replace('?', ' ').split() if len(word) > 3]
    for item in items:
        haystack = f"{item.name} {item.description} {item.category}".lower()
        if any(word in haystack for word in words):
            return (
                f"I'd point you to the {item.name} from {item.kitchen.name} -- "
                f"{item.description.lower()}, ${item.price}."
            )

    return (
        f"I can talk you through all {len(items)} dishes across our three kitchens. "
        "Tell me what you're in the mood for, or any dietary needs, and I'll pick something."
    )


def ask_concierge(message: str, history: list[dict] | None = None) -> str:
    """Call Claude with the real menu injected as grounding context. Raises on API failure.

    Falls back to a local menu-grounded reply when no API key is configured.
    """
    if is_stubbed():
        return _stub_reply(message)

    client = anthropic.Anthropic()
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(menu_context=_build_menu_context())

    messages = list(history or [])
    messages.append({'role': 'user', 'content': message})

    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=1024,
        # The menu block is identical on every question, so cache it rather than
        # paying full input price for the whole menu on each turn.
        system=[{'type': 'text', 'text': system_prompt, 'cache_control': {'type': 'ephemeral'}}],
        messages=messages,
    )

    if response.stop_reason == 'refusal':
        return "I'm not able to help with that one, but I'm happy to talk you through the menu."

    return next((block.text for block in response.content if block.type == 'text'), '')
