import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Land",
  "Commercial",
] as const;

const CONDITIONS = [
  "New Build",
  "After Renovation",
  "Needs Renovation",
  "Raw Land",
  "Ready to Build",
] as const;

const FEATURES = [
  "Sea View",
  "Parking",
  "Pool",
  "Terrace",
  "Elevator",
  "Mountain View",
  "Garden",
  "Garage",
] as const;

const CURRENCIES = ["USD", "EUR", "GEL"] as const;
const LANGUAGES = [
  "English",
  "Georgian",
  "Turkish",
  "Russian",
  "Kyrgyz",
  "Kazakh",
  "German",
  "Spanish",
  "French",
  "Portuguese",
  "Arabic",
] as const;
const TONES = ["Professional", "Friendly", "Luxury"] as const;

type FormPayload = {
  propertyType: (typeof PROPERTY_TYPES)[number];
  city: string;
  area: number;
  rooms?: number;
  floor?: number;
  totalFloors?: number;
  condition: (typeof CONDITIONS)[number];
  features: string[];
  price: number;
  currency: (typeof CURRENCIES)[number];
  targetLanguage: (typeof LANGUAGES)[number];
  tone: (typeof TONES)[number];
};

function buildPrompt(data: FormPayload): string {
  const lines = [
    `Property type: ${data.propertyType}`,
    `City: ${data.city}`,
    `Area: ${data.area} m²`,
    `Condition: ${data.condition}`,
    `Price: ${data.price} ${data.currency}`,
    `Target language for translation: ${data.targetLanguage}`,
    `Tone: ${data.tone}`,
  ];

  if (data.propertyType !== "Land" && data.rooms != null) {
    lines.push(`Rooms: ${data.rooms}`);
  }

  if (
    data.propertyType !== "Land" &&
    data.propertyType !== "House" &&
    data.floor != null &&
    data.totalFloors != null
  ) {
    lines.push(`Floor: ${data.floor} / ${data.totalFloors}`);
  }

  if (data.features.length > 0) {
    lines.push(`Features: ${data.features.join(", ")}`);
  }

  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FormPayload;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const propertyDetails = buildPrompt(body);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a real estate copywriter. Based on the property details below, generate marketing content.

Property details:
${propertyDetails}

Respond with ONLY valid JSON (no markdown fences) in this exact shape:
{
  "description": "A compelling property description in English (2-3 paragraphs)",
  "translation": "Translate the description into ${body.targetLanguage}",
  "social_post_en": "A short, engaging social media post in English (under 280 characters)",
  "social_post_translation": "Translate the social post into ${body.targetLanguage} (under 280 characters)"
}

Important: The "translation" field must be a full translation of "description" written entirely in ${body.targetLanguage}. Do not repeat the English text. The "social_post_en" field must be written entirely in English. The "social_post_translation" field must be a full translation of "social_post_en" written entirely in ${body.targetLanguage}.

Use a ${body.tone.toLowerCase()} tone throughout.`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from model" },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(textBlock.text) as {
      description: string;
      translation: string;
      social_post_en: string;
      social_post_translation: string;
    };

    const socialPost =
      body.targetLanguage === "English"
        ? parsed.social_post_en
        : `${parsed.social_post_en}\n\n--- ${body.targetLanguage} ---\n${parsed.social_post_translation}`;

    return NextResponse.json({
      description: parsed.description,
      translation: parsed.translation,
      social_post: socialPost,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 },
    );
  }
}
