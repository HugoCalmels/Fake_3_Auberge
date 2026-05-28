import { IsEmail, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateContactMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEmail()
  @MaxLength(180)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  message: string;
}